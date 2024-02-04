// eslint-disable-next-line no-undef
module.exports = {
  reactStrictMode: true,
  swcMinify: true,
  async rewrites() {
    return [
      {
        source: '/p.js',
        destination: 'https://plausible.io/js/plausible.js',
      },
      {
        source: '/e',
        destination: 'https://plausible.io/api/event',
      },
    ]
  },
}
