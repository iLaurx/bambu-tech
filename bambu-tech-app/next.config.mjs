/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow the phone on this local network to load Next development resources.
  ...(process.env.NODE_ENV === 'development' ? { allowedDevOrigins: ['192.168.1.4'] } : {}),
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
