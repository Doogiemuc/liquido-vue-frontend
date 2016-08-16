/**
 * UserService handles all CRUD and search operations for "areas".
 */
"use strict"

var BaseRestClient = require ('./BaseRestClient')

var delegationSchmea = {
  id: "/Delegation",
  type: "object",
  properties: {
    area: { type: "ObjectId", required: true },
    fromDelegee: { type: "ObjectID", required: true },
    toProxy: { type: "ObjectID", required: true },
  }
}

var options = {
  modelName: 'Delegation',
  url: 'https://api.mlab.com/api/1/databases/liquido-test/collections/delegations/${id}',
  urlParams: { apiKey: '1crkrQWik4p98uPiOzZiFG0Fkya0iNiU' },
  jsonSchema: delegationSchmea
}

class DelegationService extends BaseRestClient {
  
  /**
   * find all proxies that this user has chosen
   * @param user a delegee
   * @return all delegations that point from this delegee to a proxy in an area
   */
  getProxies(user) { 
    return this.findByQuery({from: { $oid: user._id.$oid }})
  }
  
  /**
   * sum up the number of votes a user may cast, becasue of delegation
   * Recursively traverses the tree of proxies (for that area) backwards starting from the given user.
   * @param user the proxy at the end of the chain
   * @param area which area to consider
   * @return the number of votes this proxy may cast, including his own one
   */
  getNumberOfVotes(user, area) { 
    var query = {
      area: { $oid: area._id.$oid },
      to: { $oid: user._id.$oid }
    }
    return this.findByQuery(query).then((delegees) => {
      console.log("found delegees", delegees)
      var tasks = delegees.map((delegee) => function(delegee) {
        return this.getNumberOfVotes(delegee)
      })
      console.log("tasks", tasks)
      return Promise.all(tasks).then((result) => {
        var sum = result.reduce((prev, sum) => { prev+sum}, 0)  // sum result
        console.log("sum", sum)
        return sum
      })
    })
  }
  
}

module.exports = DelegationService.getInstance(options)