/**
 * Client for Liquido backend API.
 *
 * This class is responsible for abstracting from the actual REST interface.
 * It may also combine several rest endpoints to gather information.
 * And it is responsible for caching application objects.
 *
 * This class is meant to be used as a singleton!
 */

// CuJoJs Rest Client  https://github.com/cujojs/rest
// and some of its interceptors (they are cool. That's why I decided to use this REST lib)
import rest from 'rest'
import mime from 'rest/interceptor/mime'
import errorCode from 'rest/interceptor/errorCode'
import pathPrefix from 'rest/interceptor/pathPrefix'
import basicAuth from 'rest/interceptor/basicAuth'
import logErrorInterceptor from './logErrorInterceptor'

import sessionCache from './SessionCache.js'

import loglevel from 'loglevel'
var log = loglevel.getLogger("LiquidoApiClient");

//=========================================
// Module private fields and methods
//=========================================

if (process.env.backendBaseURL === undefined) {
  throw new Error("process.env.backendBaseURL must be defined!")
}

// The CuJoJS rest client with its interceptors
var client = rest
   .wrap(mime)
   .wrap(pathPrefix, { prefix: process.env.backendBaseURL })
   .wrap(errorCode)               // Promise.reject responses with http status code >= 400 
   .wrap(logErrorInterceptor)     // log full http response if error  in one central place

// These "load..." functions load some content from the REST backend
var loadAllAreas = function() {
  return client('/areas').then( 
    response => { return Promise.resolve(response.entity._embedded.areas) }
    //not necessary any more.  See logErrorInterceptor      , errResp  => { log.error("ERROR loading ideas: "+errResp) }
  )
}

var loadAllIdeas = function() {
  return client('/ideas').then( 
    response => { return response.entity._embedded.ideas },
  )
}

var loadAllUsers = function() {
  return client('/users').then( 
    response => { return response.entity._embedded.users },
  )
}

var fetchProxyMap = function(user) {
  var userURI = user._links.self.href
  return client(userURI+'/getProxyMap').then( 
    response => { return response.entity }
  )
}

var findUserByEmail = function(email) {
  return client('/users/search/findByEmail?email='+email).then(
    response => { return response.entity }
  )
}

//=========================================
// Public/Exported methods
// Tese "fetch..." functions load some content 
// either from cache, if already in there 
// or from the the REST backend
//=========================================

//TODO: Implement LiquidoCache the ES6 way as I do it with BaseRestclient.js :   class LiquidoCache extends SessionCache { ... };   module.exports = LiquidoCache.getInstance()

module.exports = {

  // login a given user
  login(username, password) {
    log.debug("User login "+username)
    client = client.wrap(basicAuth, { username: username, password: password });
  },

  /** lazy load all areas (from cache if possible) */
  fetchAllAreas() {
    return sessionCache.load('allAreas', loadAllAreas)
  },

  /** lazy load all ideas */
  fetchAllIdeas() {
    return sessionCache.load('allIdeas', loadAllIdeas)
  },

  /** lazy load all users (from cache is possible) */
  fetchAllUsers() {
    return sessionCache.load('allUsers', loadAllUsers)
  },

  /* Fetch a map from areaId to user information of the proxy in that area */
  fetchProxyMap(user) {
    return sessionCache.load('proxyMap', fetchProxyMap, user)
  },
  
  deleteProxyMap() {
    sessionCache.deleteKey('proxyMap')
  },

  findUserByEmail: findUserByEmail,

  /** @return the internal session cache */
  getCache() {
    return sessionCache
  }

}