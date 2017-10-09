var merge = require('webpack-merge')
var devEnv = require('./dev.env')

module.exports = merge(devEnv, {
  NODE_ENV: '"testing"',
  backendBaseURL: '"http://localhost:4444/liquido/v2"'   // see also mockLiquidoBackendServer.js
})
