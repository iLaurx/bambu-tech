/** @type {import('next').NextConfig} */
const nextConfig = {
  // Isolate the local admin test server from an existing development session.
  distDir: process.env.BAMBU_ADMIN_TEST === '1' ? '.test-artifacts/next-admin' : '.next',
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
