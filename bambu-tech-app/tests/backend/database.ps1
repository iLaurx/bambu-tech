param([string]$PostgresBin = 'C:\Program Files\PostgreSQL\18\bin')
$ErrorActionPreference = 'Stop'
$appRoot = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$clusterPath = Join-Path ([IO.Path]::GetTempPath()) ('bambu-backend-test-' + [guid]::NewGuid().ToString('N'))
$portPicker = [Net.Sockets.TcpListener]::new([Net.IPAddress]::Loopback,0)
$portPicker.Start()
$testPort = $portPicker.LocalEndpoint.Port
$portPicker.Stop()
$pgCtl = Join-Path $PostgresBin 'pg_ctl.exe'
$psql = Join-Path $PostgresBin 'psql.exe'
$initdb = Join-Path $PostgresBin 'initdb.exe'
$running = $false
$startedJobs = @()
function Invoke-Checked([string]$Executable,[string[]]$Arguments) {
  & $Executable @Arguments
  if ($LASTEXITCODE -ne 0) { throw "Test command failed ($LASTEXITCODE): $Executable" }
}
try {
  Invoke-Checked $initdb @('-D',$clusterPath,'-A','trust','-U','postgres','--encoding=UTF8','--locale=C','--set=max_connections=20','--set=shared_buffers=16MB')
  Invoke-Checked $pgCtl @('-D',$clusterPath,'-l',(Join-Path $clusterPath 'server.log'),'-o',"-p $testPort -h 127.0.0.1 -F",'-w','start')
  $running = $true
  $connection = @('-h','127.0.0.1','-p',"$testPort",'-U','postgres','-d','postgres','-v','ON_ERROR_STOP=1','-X')
  Invoke-Checked $psql ($connection + @('-f',(Join-Path $PSScriptRoot 'bootstrap.sql')))
  Invoke-Checked $psql ($connection + @('-f',(Join-Path $appRoot 'supabase/migrations/202611060001_backend.sql')))
  Invoke-Checked $psql ($connection + @('-f',(Join-Path $PSScriptRoot 'database.sql')))
  $concurrentSql = "set role anon; set request.jwt.claim.sub=''; select public.increment_product_views('11111111-1111-4111-8111-111111111111') from generate_series(1,50);"
  1..8 | ForEach-Object {
    $startedJobs += Start-Job -ScriptBlock {
      param($exe,$connectionArgs,$sql)
      & $exe @connectionArgs '-c' $sql | Out-Null
      if ($LASTEXITCODE -ne 0) { throw 'Concurrent SQL failed' }
    } -ArgumentList $psql,$connection,$concurrentSql
  }
  $startedJobs | Wait-Job | Out-Null
  $startedJobs | Receive-Job -ErrorAction Stop
  if ($startedJobs.Where({ $_.State -ne 'Completed' }).Count -gt 0) { throw 'Concurrent job failed' }
  Invoke-Checked $psql ($connection + @('-c',"select public.test_assert((select views_count=401 from public.products),'400 concurrent increments preserved');"))
  Write-Output 'PASS: PostgreSQL SQL/RLS/state checks and 8 x 50 concurrent increments. Auth/Storage are test stubs.'
} finally {
  if ($running) { & $pgCtl '-D' $clusterPath '-m' 'fast' '-w' 'stop' }
  $startedJobs | Remove-Job -Force -ErrorAction SilentlyContinue
  # Keep isolated test files/logs for audit; never touch an existing database or service.
  Write-Output "Isolated test finished; files retained if initialization succeeded: $clusterPath"
}
