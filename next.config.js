/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/__/auth/:path*',
        destination: 'https://woohacks25-jgehs1lhj-matthew-pookies-projects.vercel.app/__/auth/:path*',
        permanent: true,
      },
    ];
  },
}

module.exports = nextConfig 