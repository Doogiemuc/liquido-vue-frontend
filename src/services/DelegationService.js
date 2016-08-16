/**
 * UserService handles all CRUD and search operations for "areas".
 */
"use strict"

var BaseRestClient = require ('./BaseRestClient')
var log = require("loglevel").getLogger("DelegationService");

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
   * find all proxies that this user has chosen in any area
   * @param userId plain ID of a delegee
   * @return all delegations that point from this delegee to a proxy in an area
   */
  getAllProxies(userId) {
    return this.findByQuery({ from: { $oid: userId } })
  }

  /**
   * sum up the number of votes a user may cast, becasue of delegation
   * Recursively traverses the tree of proxies (for that area) backwards starting from the given user.
   * @param userId plain ID string of the proxy at the end of the chain
   * @param areaId plain ID string of the area to consider
   * @return (A Promise that will resolve to) the number of votes this proxy may cast, including his own one
   */
  getNumberOfVotes(userId, areaId) {
    //TODO:  move getNumberOfVotes() to the server!  This is security relevant

    var queryForDelegations = {
      area: { $oid: areaId },
      to: { $oid: userId }
    }
    var that = this
    return that.findByQuery(queryForDelegations).then(delegations => {
      if (delegations.length == 0) return 1      // his own vote
      //console.log("found "+delegees.length+" delegees:\n", delegees)
      var tasks = delegations.map((delegation) => {
        log.debug("Found delegation from "+delegation.from.$oid+" to "+delegation.to.$oid)
        return that.getNumberOfVotes(delegation.from.$oid, areaId)   // look for transitive proxies
      })
      return Promise.all(tasks).then(result => {
        log.debug("result", result)
        var sum = result.reduce((prev, cur) => { return prev+cur })  // sum result
        return sum + 1
      })
    })
  }

}

module.exports = DelegationService.getInstance(options)