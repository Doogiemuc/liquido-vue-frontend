module.exports = {
  NODE_ENV: '"production"',
  backendBaseURL: '"http://ec2-52-208-204-181.eu-west-1.compute.amazonaws.com:8080/liquido/v2"',
  liquidoWebAppVersion: '"41.1"',

  //TODO: let voter choose tokenSecret for maximum security. This dummy one is from TestFixtures.java
  tokenSecret: '"userTokenSecret"',

  // Only for development and tests: SMS Token that can login the admin
  devLoginToken: '"998877"'
}
