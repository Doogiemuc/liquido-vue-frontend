var merge = require('webpack-merge')
var prodEnv = require('./prod.env')

/* Keep in mind, that all values in this JSON must be quoted with single AND double quotes, because of webpack !!! */
module.exports = merge(prodEnv, {
  NODE_ENV: '"development"',
  //backendBaseURL: '"http://ec2-52-208-204-181.eu-west-1.compute.amazonaws.com/liquido/v2"',     // URL of rest endpoint in backend (WITHOUT trailing slash!)
	backendBaseURL: '"http://localhost:8080/liquido/v2"',

  // Only for development and tests: Defualt SMS login Token that always works to login ANY user
  //devLoginToken: '"998877"',   // already included from prod.env.js

  //TODO: let voter choose tokenSecret for maximum security. This dummy one is from TestFixtures.java
  //tokenSecret: '"userTokenSecret"'   // already included from prod.env
})
