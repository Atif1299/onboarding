/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,

  // Webpack optimization for memory management
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // Reduce memory usage in development
      config.optimization = {
        ...config.optimization,
        runtimeChunk: false,
        splitChunks: false,
      };

      // Disable webpack cache in development to prevent memory issues
      config.cache = false;
    }

    return config;
  },

  // Experimental features to reduce memory usage
  experimental: {
    // Reduce memory footprint
    workerThreads: false,
    cpus: 1,
  },
};

export default nextConfig;
