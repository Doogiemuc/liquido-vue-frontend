var merge = require('webpack-merge')
var devEnv = require('./dev.env')

module.exports = merge(devEnv, {
  NODE_ENV: '"testing"',
  backendBaseURL: '"http://localhost:8080/liquido/v2"',   // see mockLiquidoBackendServer.js  for mock backend on port 4444
  devAutoLoginUserIdx: undefined,   // no automatic login for tests
  portForTesting: 3005
})
