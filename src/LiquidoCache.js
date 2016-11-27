/**
 * Global session cache for liquido
 * Uses the SessionCache.js and implements some Liquido specific fetch... methods on top of it.
 *
 * This class is meant to be used as a singleton!
 */

import cache from './SessionCache.js'
import areaService from './services/AreaService.js'
import userService from './services/UserService.js'
import ideaService from './services/IdeaService.js'
import delegationService from './services/DelegationService.js'

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

/* load all information necessary for proxyMap of the currenetly logged in user*/
var loadProxyMap = function(user) {
  //console.log("===== RootApp.loadProxyMap(user=", user)
  var userId = userService.getId(user)
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

module.exports = {
  /** lazy load all areas (from cache if possible) */
  fetchAllAreas: function() {
    return cache.load('allAreas', areaService.getAll.bind(areaService) )
      .catch(err => { console.error("ERROR loading areas in RootApp.vue: "+err) })
  },

  /** lazy load all ideas with populated field 'createdBy' */
  fetchAllIdeas: function() {
    return cache.load('populatedIdeas', loadPopulatedIdeas )
      .catch(err => { console.error("ERROR loading ideas in RootApp.vue: "+err) })
  },

  /** lazy load all users (from cache is possible) */
  fetchAllUsers: function() {
    return cache.load('allUsers', userService.getAll.bind(userService))
      .catch(err => { console.error("ERROR loading users in RootApp.vue: "+err) })
  },

  /* Lazyly createa a map  from areaId to user information of the proxy in that area */
  fetchProxyMap: function(userId) {
    return cache.load('proxyMap', loadProxyMap, userId)
      .catch(err => { console.error("ERROR loading ProxyMap in RootApp.vue "+err) })
  }

}