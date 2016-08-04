/**
 * This service is responsible for doing CRUD operations for "Users".
 * Lazy loading into cache.
 * It is a Javascript abstraction for the interface to the DB.
 */
"use strict"
 
var BaseRestClient = require ('./BaseRestClient')

module.exports = class UserService extends BaseRestClient {
  
  constructor() {
    var url       = 'https://api.mlab.com/api/1/databases/liquido-test/collections/ideas/${id}'
    var urlParams = { apiKey: '1crkrQWik4p98uPiOzZiFG0Fkya0iNiU' }
    super(url, urlParams)
  }
  
  // overwrite parent method to get mongodb oid of a user 
  getId(idea) {
    return idea._id.$oid
  }

}

