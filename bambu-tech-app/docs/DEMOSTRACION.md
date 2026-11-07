# Demostración local

Esta modalidad muestra tres celulares con imágenes locales y precios ficticios. Se identifica en la tienda como demostración; no representa inventario real. El panel y el acceso administrativo están deshabilitados, WhatsApp no está configurado y las vistas no se guardan. No se conecta con Supabase y no modifica su información.

Desde PowerShell, dentro de `bambu-tech-app`, inicia una nueva terminal con:

```powershell
$env:BAMBU_DEMO='1'
pnpm dev
```

Abre `http://localhost:3000`. Para usar la dirección Wi-Fi configurada en esta computadora, puedes usar `pnpm dev:lan` en lugar de `pnpm dev`; esa modalidad no escucha en localhost y la IP puede cambiar. Si el puerto está ocupado, detén únicamente el servidor que tú mismo iniciaste o usa otro puerto; no detengas procesos ajenos.

Para salir, detén el servidor de demostración con Ctrl+C y cierra esa terminal, o ejecuta `Remove-Item Env:BAMBU_DEMO` antes de volver a iniciar. Al iniciar sin esa variable se usa la configuración normal de la app, sin transferir productos de ejemplo. Cada persona deberá configurar su propio Supabase y sus credenciales de servidor sin compartirlas por chat ni guardarlas en el repositorio.

La variable solo habilita la demostración en desarrollo. Si se activa en producción, las rutas de datos se bloquean; no se muestran datos de ejemplo ni se usa la base real como alternativa.
