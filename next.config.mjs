/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    turbo: {
      resolveAlias: {
        'pino': false,
        'pino-pretty': false,
        'thread-stream': false,
        'sonic-boom': false,
        'tap': false,
        'desm': false,
        'fastbench': false,
        'pino-elasticsearch': false,
      },
    },
  },
  webpack: (config, { isServer }) => {
    // Ignore problematic node_modules test files
    config.ignoreWarnings = [
      ...config.ignoreWarnings || [],
      { module: /node_modules\/(pino|thread-stream)/ },
    ]
    
    if (!isServer) {
      config.externals = {
        ...config.externals,
        'pino': 'commonjs pino',
        'pino-pretty': 'commonjs pino-pretty',
        'thread-stream': 'commonjs thread-stream',
        'sonic-boom': 'commonjs sonic-boom',
      }
    }
    return config
  },
}

export default nextConfig
