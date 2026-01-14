/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    STEAM_API_KEY: process.env.STEAM_API_KEY,
  },
  webpack: (config, { isServer }) => {
    // Configuration pour les modules CommonJS
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    
    // Supprimer les warnings de résolution de chemins
    config.resolve.symlinks = false;
    
    // Ignorer les warnings de résolution de TypeScript
    config.ignoreWarnings = [
      /Failed to parse source map/,
      /Resolving .* typescript.* doesn't lead to expected result/,
    ];
    
    return config;
  },
  // Supprimer les warnings de build
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
}

module.exports = nextConfig
