/**
 * DelegationService handles all CRUD and search operations for "delegations" from a delegee to a proxy.
 * When a user delgates his vote to a proxy in one given area, then this delegation is added as a link
 * from 'delegee' to the 'proxy' in that area.
 *
 * Keep in mind that a "service" must not have any dependencies to other services. I only handles
 * everything around one 'model'. Relations between models are handled in LiquidoCache and RootApp.
 */
"use strict"

var BaseRestClient = require('./BaseRestClient')
var log = require("loglevel").getLogger("DelegationService");

var delegationSchema = {
  id: "/Delegation",
  type: "object",
  properties: {
    area: { type: "ObjectId", required: true },
    from: { type: "ObjectID", required: true },
    to:   { type: "ObjectID", required: true },
  }
}

var options = {
  modelName: 'Delegation',
  baseURL: 'http://localhost:4444',  // base URL of liquido backend
  url: 'https://api.mlab.com/api/1/databases/liquido-test/collections/delegations/${id}',
  urlParams: { apiKey: '1crkrQWik4p98uPiOzZiFG0Fkya0iNiU' },
  jsonSchema: delegationSchema
}


//=========================================
// Module private methods
//=========================================



/**
 * DelegationService class
 *
 * Handles everything around delegations from electorates to proxies.
 */
class DelegationService extends BaseRestClient {

  /**
   * Get all proxies that this userId has delegated to (per area)
   * If you need the user information of the proxies, then you can simply populate them from the to._ids
   */
  getDelegationsFrom(userId) {
    return this.findByQuery({ fromUser: { $oid: userId } })
  }

  /**
   * find the delegation that a given user has in one area
   * @return the delegation or NULL if that user currently has no proxy assigned in that area.
   */
  findByUserAndArea(userId, areaId) {
    return this.findByQuery({ fromUser: { $oid: userId }, area: { $oid: areaId } })
      .then(foundDelegations => {
        if (foundDelegations.length >= 1) return foundDelegations[0]
        return null
      })
  }

  /**
   * Query the backend for the number of votes that this user may cast in this area
   * due to (transitive) proxies. Will include his own vote!
   *
   * @param userId plain ID string of the proxy at the end of the chain
   * @param areaId plain ID string of the area to consider
   * @return (A Promise that will resolve to) the number of votes this proxy may cast, including his own one
   */
  getNumberOfVotes(userId, areaId) {
    log.debug(this.options.modelName+".getNumVotes() => userId="+userId+", areaId="+areaId)
    var that = this;
    return new Promise(function(resolve, reject) {
      that.client.get(that.options.baseURL+"/users/"+userId+"/getNumVotes?areaId="+areaId, function(responseBodyAsObject, rawResponse) {
        var numVotes = responseBodyAsObject.toString()     // responseBodyAsObject is a Buffer. Need to convert to string
        log.debug(that.options.modelName+".getNumVotes() <= "+numVotes)
        resolve(numVotes)
      }).on('error', function (err) {
        log.error("ERROR in getNumberOfVotes()"+err)
        reject('ERROR in getNumberOfVotes():'+err)
      })
    })
  }

  /**
   * Save a newly assigned proxy. Will overwrite any existing assignment for this user and area.
   *
   * @param userId   the delegee
   * @param areaId   Area of interest for this delegation
   * @param proxyId  ID of proxy
   * @return (A Promise that will resolve to) the payload of the response (Ok)
   */
  saveProxy(userId, areaId, proxyId) {
    log.debug("DelegationService.saveProxy() => userId="+userId+", areaId="+areaId+", proxyId="+proxyId)
    var newDelegation = {
      fromUser: { $oid : userId  },
      toProxy:  { $oid : proxyId },
      area:     { $oid : areaId  }
    }
    var query  = newDelegation
    var params = {
      url: this.baseURL+'/delegations'
    }
    return this.upsertItem(query, newDelegation, params)
  }

}

module.exports = DelegationService.getInstance(options)
