/**
 * This service is responsible for doing CRUD operations for "Users".
 * Lazy loading into cache.
 * It is a Javascript abstraction for the interface to the DB.
 */

var Client = require('node-rest-client').Client,
    client = new Client()

client.on('error', function(err) {
  console.error('ERROR in node-rest-client', err)
})

module.exports = class UserService {
  
  constructor() {
    this.url    = 'https://api.mlab.com/api/1/databases/liquido-test/collections/users/${id}'
    this.apiKey = '1crkrQWik4p98uPiOzZiFG0Fkya0iNiU'
    this.cachedUsers = {}   // already loaded users by id
  }
  
  getAll() {
    var that = this
    var args = {
      parameters: { apiKey: this.apiKey },
      path: { id: '' }
    }
    return new Promise(function(resolve, reject) {
      client.get(that.url, args, function(data, response) {
        
        resolve(data)
      }).on('ERROR in User.getAll()', reject)
    })
  }
  
  getById(id) {
    if (this.cachedUsers[id] !== undefined) {
      return Promise.resolve(this.cachedUsers[id])
    }
    var that = this
    var args = {
      parameters: { apiKey: this.apiKey },
      path: { id: id }
    }
    return new Promise(function(resolve, reject) {
      console.log("sending request id="+id)
      client.get(that.url, args, function(data, response) {
        that.cachedUsers[id] = data  // remember user in cache
        resolve(data)
      }).on('ERROR in User.getById('+id+')', reject)
    })
  }
  
  /**
   * find user(s) by query
   * @param query  e.g. { email: "user@host.com" }
   */
  findByQuery(query) {
    var that = this
    var args = {
      parameters: { apiKey: this.apiKey },
      path: { q: JSON.stringify(query)  }
    }
    return new Promise(function(resolve, reject) {
      client.get(that.url, args, function(data, response) {
        resolve(data)
      }).on('ERROR in User.findByQuery('+query+')', reject)
    })
  }

}

