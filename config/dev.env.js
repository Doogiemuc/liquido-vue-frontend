var merge = require('webpack-merge')
var prodEnv = require('./prod.env')

/* Keep in mind, that all values in this JSON must be quoted with single AND double quotes, because of webpack !!! */
module.exports = merge(prodEnv, {
  NODE_ENV: '"development"',
  backendBaseURL: '"http://localhost:8080/liquido/v2"',     // URL of rest endpoint in backend (WITHOUT trailing slash!)

  // These user can be logged in with one click
  devUsers: '['+
    '{ "mobilephone": "+49 123451", "name": "Donald Duck"},'+
    '{ "mobilephone": "+49 123452", "name": "User2"},'+
    '{ "mobilephone": "+49 123453", "name": "User3"},'+
    '{ "mobilephone": "+49 123454", "name": "User4"},'+
    '{ "mobilephone": "+49 123455", "name": "User5"},'+
  ']',

  // User with this mobilephone is automatically logged in at startup. Set to 'undefined' to disable this feature.
  autoLoginMobilephone: undefined,

  // Secret Sms Code that always works to login ANY user
  devLoginDummySmsCode: '"998877"',

  //TODO: let voter choose tokenSecret for maximum security. This dummy one is from TestFixtures.java
  tokenSecret: '"userTokenSecret"'
})
