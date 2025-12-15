/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/',
        destination: '/popup.html',
      },
    ]
  },
}

module.exports = nextConfig
