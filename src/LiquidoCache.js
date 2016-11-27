/**
 * Global session cache for liquido
 * Uses the SessionCache.js and implements some Liquido specific fetch... methods on top of it.
 * /services only handle one rest endpoint. SessionCache combines several entities (via population) where necessary.
 *
 * This class is meant to be used as a singleton!
 */

import sessionCache from './SessionCache.js'
import areaService from './services/AreaService.js'
import userService from './services/UserService.js'
import ideaService from './services/IdeaService.js'
import delegationService from './services/DelegationService.js'
import _ from 'lodash'

//=========================================
// Module private methods
//=========================================

/** helper method that creates a map  areaId => proxy user information */
var createProxyMap = function(populatedDels) {
  var proxyMap = {}
  for(let delegation of populatedDels) {
    var areaId = delegation.area.$oid
    proxyMap[areaId] = delegation.toProxy
  }
  return proxyMap
}

/** load all information necessary for proxyMap of the currenetly logged in user */
var loadProxyMap = function(user) {
  var userId = user;
  if (_.isObject(user)) {
    userId = userService.getId(user)
  }
  return delegationService.getDelegationsFrom(userId).then(delegations => {
    return delegationService.populateAll(delegations, 'toProxy', userService).then(createProxyMap)
  })
}

var loadPopulatedIdeas = function() {
  return ideaService.getAll()
    .then(ideas => {
      return ideaService.populateAll(ideas, 'createdBy', userService)
    })
}

//=========================================
// Public/Exported methods
//=========================================

//TODO: Implement LiquidoCache the ES6 way as I do it with BaseRestclient.js :   class LiquidoCache extends SessionCache { ... };   module.exports = LiquidoCache.getInstance()

module.exports = {
  /** lazy load all areas (from cache if possible) */
  fetchAllAreas: function() {
    return sessionCache.load('allAreas', areaService.getAll.bind(areaService) )
      .catch(err => { console.error("ERROR loading areas in LiquiodoCache: "+err) })
  },

  /** lazy load all ideas with populated field 'createdBy' */
  fetchAllIdeas: function() {
    return sessionCache.load('populatedIdeas', loadPopulatedIdeas )
      .catch(err => { console.error("ERROR loading ideas in LiquiodoCache: "+err) })
  },

  /** lazy load all users (from cache is possible) */
  fetchAllUsers: function() {
    return sessionCache.load('allUsers', userService.getAll.bind(userService))
      .catch(err => { console.error("ERROR loading users in LiquiodoCache: "+err) })
  },

  /* Lazyly createa a map from areaId to user information of the proxy in that area */
  fetchProxyMap: function(user) {
    return sessionCache.load('proxyMap', loadProxyMap, user)
      .catch(err => { console.error("ERROR loading ProxyMap in LiquiodoCache "+err) })
  },

  /** @return the internal session cache */
  getCache: function() {
    return sessionCache
  }

}