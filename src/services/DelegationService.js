/**
 * UserService handles all CRUD and search operations for "delegations" from a delegee to a proxy.
 * When a user delgates his vote to a proxy in one given area, then this delegation is added a a link
 * from 'delegee' to the 'proxy' in that area.
 *
 */
"use strict"

var BaseRestClient = require('./BaseRestClient')
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
   * sum up the number of votes a proxy may cast, becasue of delegations to him.
   * Recursively traverses the tree of proxies (for that area) backwards starting from the given user.
   * @param userId plain ID string of the proxy at the end of the chain
   * @param areaId plain ID string of the area to consider
   * @return (A Promise that will resolve to) the number of votes this proxy may cast, including his own one
   */
  getNumberOfVotes(userId, areaId) {
    var that = this;
    var getNumVotesURL = that.options.baseURL+"/users/"+userId+"/getNumVotes?areaId="+areaId;
    return new Promise(function(resolve, reject) {
      that.client.get(getNumVotesURL, function(data, response) {
        log.debug(that.options.modelName+".getNumVotes() <= "+data)
        resolve(data)
      }).on('error', function (err) {
        log.error("ERROR in getAll()", err)
        reject('ERROR in BaseRestClient.getAll():', err)
      })
    })

    /*  MOVED to server
    var queryForDelegations = {
      area: { $oid: areaId },
      to: { $oid: userId }
    }
    var that = this
    return that.findByQuery(queryForDelegations).then(delegations => {
      if (delegations.length == 0) return 1      // vote of delegee
      //console.log("found "+delegees.length+" delegees:\n", delegees)
      var tasks = delegations.map((delegation) => {
        log.debug("Found delegation from "+delegation.from.$oid+" to "+delegation.to.$oid)
        return that.getNumberOfVotes(delegation.from.$oid, areaId)   // look for transitive proxies
      })
      return Promise.all(tasks).then(result => {
        log.debug("result", result)
        var sum = result.reduce((prev, cur) => { return prev+cur })  // sum result.  "A for loop is soooo 2008'ish :-)"
        return sum + 1  // +1 for own vote of proxy
      })
    })
    */
  }

}

module.exports = DelegationService.getInstance(options)