/**
 * UserService handles all CRUD and search operations for "users" and
 * - hashing and validating of passwords (on the client!)
 * -
 */
"use strict"

var BaseRestClient = require ('./BaseRestClient')
var bcrypt = require('bcrypt-nodejs');

/** Schema for validating a user. (see jsonschema.org) */
var userSchmea = {
  id: "/User",
  type: "object",
  properties: {
    email: { type: "string" },
    passwordHash: { type: "string" },
    profile: {
      type: "object",
      properties: {
        name : { type: "string" },
        website : { type: "string", format:"url" },
        picture : { type: "string", format:"url" },
      }
    },
    // validation for createdAt and updatedAt timestamps will automatically be added in BaseRestClient
  },
  required: [ "email", "passwordHash" ]
}

var options = {
  modelName: 'User',
  url: 'https://api.mlab.com/api/1/databases/liquido-test/collections/users/${id}',
  urlParams: { apiKey: '1crkrQWik4p98uPiOzZiFG0Fkya0iNiU' },
  nameOfIdAttr: '_id',
  timestamps: true,
  jsonSchema: userSchmea
}

class UserService extends BaseRestClient {

  /**
   * set a new password. the given password will be hashed with bcrypt and onle the passwordHash will be stored
   */
  setPassword(user, newPassword) {
    user.passwordHash = bcrypt.hashSync(newPassword);
  }

  /**
   * check if a given password is correct
   * @param user a user from the DB
   * @param checkPassword the string that was entered, eg. in a login form
   * @return true if checkPassword is correkt
   */
  checkPassword(user, checkPassword) {
    return bcrypt.compareSync(checkPassword, user.passwordHash);
  }

  //TODO:  getProxies(user) { get proxies per area }
}

/**
 * This service exports a singleton instance.
 * So you can simply `require(...)` this file and use the returned instance without calling new.
 * It will always be the same instance (with one internal cache).
 */
module.exports = UserService.getInstance(options)