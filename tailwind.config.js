// eslint-disable-next-line no-undef
const isProduction = process.env.NODE_ENV === 'production'

// eslint-disable-next-line no-undef
module.exports = {
  future: {
    removeDeprecatedGapUtilities: true,
    purgeLayersByDefault: true,
  },
  purge: {
    enabled: isProduction,
    content: ['./src/**/*.tsx', './src/**/*.css'],
  },
  theme: {
    extend: {},
  },
  variants: {},
  plugins: [],
}
