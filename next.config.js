/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    PYTHON_BACKEND_URL: process.env.PYTHON_BACKEND_URL || 'https://cab-twelve-capacity-electrical.trycloudflare.com',
  },
}
module.exports = nextConfig
