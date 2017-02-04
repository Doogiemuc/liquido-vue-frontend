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
// and some of its interceptors (they are cool. That's why I decided to use this REST lib.
import rest from 'rest'
import mime from 'rest/interceptor/mime'
import errorCode from 'rest/interceptor/errorCode'
import pathPrefix from 'rest/interceptor/pathPrefix'
import basicAuth from 'rest/interceptor/basicAuth'
//MAYBE: import hateoas from 'rest/interceptors/hateoas'     // Hypermedia AS the Engine of State HATEOAS. Test this. Could be useful with spring-hateoas.
//import logErrorInterceptor from './logErrorInterceptor'   // Currently not used.   thers 'nough loggin' already :-)

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
var client = rest.wrap(mime, { mime: 'application/json'} )
                 .wrap(errorCode)               // Promise.reject responses with http status code >= 400 
                 .wrap(pathPrefix, { prefix: process.env.backendBaseURL })
              // .wrap(logErrorInterceptor)     // log full http response if error  in one central place

// check if backend is alive.
// @return A Promise that will reject (quickly) when the backend is not reachable.
var ping = function() {
  return client('/_ping')
}

// These "load..." functions load some content from the REST backend
var loadAllAreas = function() {
  return client('/areas').then( 
    response => { return Promise.resolve(response.entity._embedded.areas) }
    //TODO: handle errors individually or in a central place?   logErrorInterceptor   vs.    errResp  => { log.error("ERROR loading areas: "+errResp) }
  )
}

var loadAllIdeas = function() {
  return client('/ideas').then( 
    response => { return response.entity._embedded.ideas },
  )
}

/** 
 * update an existing(!) idea.
 * @param ideaURI the absolute REST path to the resource of the idea on the server. 
 * @param the fields that shall be updated. (Does not need to contain all fields.)
 * @return the response sent from the server which is normally the complete updated idea with all fields.
 */
var patchIdea = function(ideaURI, ideaUpdate) {
  if (!ideaURI.startsWith('http')) log.error("ERROR in updateIdea: URI must start with http(s) !")
  log.debug("patchIdea "+ideaURI+" updated="+JSON.stringify(ideaUpdate))
  return client({ 
    method: 'PATCH', 
    path: ideaURI, 
    header: { 'Content-Type' : 'application/json' },
    entity: ideaUpdate
  }).then(res => { 
    return res.entity 
  })
}

// add user as a supporter to an idea
var addSupporter = function(idea, user) {
  //TODO: ...
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

  // login a given user. Every future request will send these credentials with HTTP BasicAuth
  setLogin(username, password) {
    log.debug("User login: "+username)
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

  /** fetches the 10 most recently updated ideas */
  fetchRecentIdeas() {
    return client('/ideas/search/recentIdeas').then(res => { return res.entity })
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
  ping: ping,
  patchIdea: patchIdea,

  /** @return the internal session cache */
  getCache() {
    return sessionCache
  }

}