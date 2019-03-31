var merge = require('webpack-merge')
var prodEnv = require('./prod.env')

/* Keep in mind, that all values in this JSON must be quoted with single AND double quotes, because of webpack !!! */
module.exports = merge(prodEnv, {
  NODE_ENV: '"development"',
  backendBaseURL: '"http://localhost:8080/liquido/v2"',     // URL of HATEOAS rest endpoint in backend (without trailing slash)

  // These user can be logged in with one click
  devLoginMobilePhones: '["+49 123451", "+49 123452", "+49 123453", "+49 123454", "+49 123455", "+49 123456", "+49 123457"]',
  devLoginDummySmsCode: '"998877"',
  // This devLoginMobilePhone is automatically logged in at startup. Set to undefined to disable auto login
  devAutoLoginUserIdx: 0,

  tokenSecret: '"userTokenSecret"'    //TODO: let voter choose tokenSecret. This dummy one is from TestFixtures.java"
})
