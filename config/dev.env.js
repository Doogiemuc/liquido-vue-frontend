var merge = require('webpack-merge')
var prodEnv = require('./prod.env')

module.exports = merge(prodEnv, {
  NODE_ENV: '"development"',
  backendBaseURL: '"http://localhost:8080/liquido/v2"',     // URL of HATEOAS rest endpoint in backend (without trailing slash)

  // This user will automatically be logged in
  autoLoginUser: '""',
  autoLoginPass: '""',

  // This user can be automatically logged in with one click on the original login page
  devLoginUser: '"testuser1@liquido.de"',
  devLoginPass: '"dummyPasswordHash"',
})
