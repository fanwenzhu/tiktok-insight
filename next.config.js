/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: { unoptimized: true },
  env: {
    NEXT_PUBLIC_PYTHON_BACKEND_URL: process.env.PYTHON_BACKEND_URL || 'https://patricia-archived-remind-allocation.trycloudflare.com',
  },
}
module.exports = nextConfig
