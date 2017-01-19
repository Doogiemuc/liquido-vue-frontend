/**
 * Client for Liquido backend API.
 *
 * This class is responsible for abstracting from the actual REST interface.
 * It may also combine several rest endpoints to gather information.
 * And it is responsible for caching application objects.
 *
 * This class is meant to be used as a singleton!
 */

import restClient from './RestClient.js'
import sessionCache from './SessionCache.js'

//=========================================
// Module private methods
//=========================================


//=========================================
// Public/Exported methods
//=========================================

//TODO: Implement LiquidoCache the ES6 way as I do it with BaseRestclient.js :   class LiquidoCache extends SessionCache { ... };   module.exports = LiquidoCache.getInstance()

module.exports = {
  /** lazy load all areas (from cache if possible) */
  fetchAllAreas() {
    return sessionCache.load('allAreas', restClient.getAllAreas)
      .catch(err => { console.error("ERROR loading areas in LiquidoCache: "+err) })
  },

  /** lazy load all ideas with populated field 'createdBy' */
  fetchAllIdeas() {
    return sessionCache.load('allIdeas', restClient.getAllIdeas )
      .catch(err => { console.error("ERROR loading ideas in LiquidoCache: "+err) })
  },

  /** lazy load all users (from cache is possible) */
  fetchAllUsers() {
    return sessionCache.load('allUsers', userService.getAll.bind(userService))
      .catch(err => { console.error("ERROR loading users in LiquidoCache: "+err) })
  },

  /* Fetch a map from areaId to user information of the proxy in that area */
  fetchProxyMap(user) {
    return sessionCache.load('proxyMap', restClient.getProxyMap, user)
      .catch(err => { console.error("ERROR loading ProxyMap in LiquidoCache "+err) })
  },
  
  deleteProxyMap() {
    sessionCache.deleteKey('proxyMap')
  },

  /** @return the internal session cache */
  getCache() {
    return sessionCache
  }

}