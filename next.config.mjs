/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups'
          }
        ]
      }
    ];
  },
  experimental: {
    esmExternals: 'loose',
    serverComponentsExternalPackages: ['undici']
  },
  transpilePackages: ['undici', '@firebase/auth']
};

export default nextConfig;
