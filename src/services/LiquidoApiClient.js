/**
 * Client for Liquido backend API.
 *
 * This class is responsible for abstracting from the actual REST interface.
 * It may also combine several rest endpoints to gather information.
 * And it is responsible for caching application objects.
 *
 * This class is meant to be used as a singleton!
 */


//Implementation note: 
//The server sends "areas". Here on the client we rename them to "categories".
//But there is one catch: The inlined child references coming from the server are still named "areas".
//But I wanted to test the  separation between client and server. So I use this as a test case. Maybe also a preview on future localisation support

// CuJoJs Rest Client  https://github.com/cujojs/rest
// and some of its interceptors (they are cool. That's why I decided to use this REST lib.
import _ from 'lodash'
import rest from 'rest'
import mime from 'rest/interceptor/mime'
import errorCode from 'rest/interceptor/errorCode'
import pathPrefix from 'rest/interceptor/pathPrefix'
import basicAuth from 'rest/interceptor/basicAuth'
import logRequestsInterceptor from './logRequestsInterceptor'  // A lot of logging
//MAYBE: import hateoas from 'rest/interceptors/hateoas'     // Hypermedia AS the Engine of State HATEOAS. Test this. Could be useful with spring-hateoas.
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
                 .wrap(logRequestsInterceptor)

//Keep in mind that all requests must be authenticated. So you must call setLogin() first!

/** 
 * Check if backend is alive.
 * @return A Promise that will reject (quickly) when the backend is not reachable.
 */
var ping = function() {
  return client('/_ping') .then(result => {
    if (result.error != "") return Promise.reject("Connection error")    //BUGFIX:  No error status is set on conction error???
    return result
  })
}

// All "load..." functions load some content from the REST backend
var loadAllCategories = function() {
  return client('/areas').then(                                      // <=== here we rename from ideas to categories!
    response => { return Promise.resolve(response.entity._embedded.areas) }    
    //TODO: handle errors individually or in a central place?   logErrorInterceptor   vs.    errResp  => { log.error("ERROR loading categories: "+errResp) }
  )
}

var loadAllIdeas = function() {
  return client('/ideas').then( 
    response => { return response.entity._embedded.ideas },
  )
}

/**
 * save a new(!) idea in the backend
 * The new idea will automatically be createdBy the currently logged in user.
 */
var saveIdea = function(newIdea) {
  log.debug("POST newIdea: "+JSON.stringify(newIdea))
  return client({
    method: 'POST',
    path:   '/ideas',
    header: { 'Content-Type' : 'application/json' },
    entity: newIdea
  }).then(res => { 
    return res.entity 
  }).catch(err => {
    log.error("Cannot post newIdea:"+JSON.stringify(newIdea)+" :", err)
  })
}

/** 
 * Update some fields of an existing(!) object.
 * @param URI the absolute REST path to the resource on the server. 
 * @param the fields that shall be updated. (Does not need to contain all fields.)
 * @return the response sent from the server which is normally the complete updated resource with all its fields.
 */
var patch = function(uri, update) {
  log.debug("PATCH "+uri+" "+JSON.stringify(update))
  if (!uri.startsWith('http')) log.error("ERROR in patch: URI must start with http(s)! wrong_uri="+uri)
  if (!update) log.warn("WARNING: PATCH called with empty update")
  return client({ 
    method: 'PATCH', 
    path:   uri, 
    header: { 'Content-Type' : 'application/json' },
    entity: update
  }).then(res => { 
    return res.entity 
  }).catch(err => {
    log.error("Cannot patch "+uri+" : "+err)
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

// Load all proposals that are currently open for voting.
// Will return at least an empty array.
var loadOpenForVotingProposals = function() {
  return client('/laws/search/findByStatus?status=VOTING').then(
    response => { return response.entity._embedded.laws}
  )
}

//=========================================
// Public/Exported methods
//
// The "fetch..." functions get some content from cache, if already in there or from the the backend via the "load..." functions.
//=========================================

//MAYBE: Implement LiquidoCache the ES6 way as I do it with BaseRestclient.js :   class LiquidoCache extends SessionCache { ... };   module.exports = LiquidoCache.getInstance()

module.exports = {

  // login a given user. Every future request will send these credentials with HTTP BasicAuth
  setLogin(username, password) {
    log.debug("User login: "+username)
    client = client.wrap(basicAuth, { username: username, password: password });
  },

  /** lazy load all categories (from cache if possible) */
  fetchAllCategories() {
    return sessionCache.load('allCategories', loadAllCategories)
  },

  getCategory(categoryURI) {
    if (!uri.startsWith('http')) log.error("Cannot getCategory: CategoryURI must start with http(s)! wrong_uri="+categoryURI)
    return client({path: categoryURI}).then(res => {return res.entity })
  },

  /** lazy load all ideas */
  fetchAllIdeas() {
    return sessionCache.load('allIdeas', loadAllIdeas)
  },

  /** 
   * load one idea from the backend
   * @param ideaIDorURI  either the numerical ID of an idea or the absolute REST URI of the REST resource on the backend, e.g. 
   */
  getIdea(uri) {
    var ideaRegEx = new RegExp('^https?://.*/ideas/(\w?)$')
    if (ideaRegEx.test(uri)) {
      return client({path: uri}).then(res => {return res.entity })
    } else if (_.isString(uri)) {
      return client('/ideas/'+uri).then(res => {return res.entity })    // idea ID was passed as a number
    } else {
      throw "Cannot get Idea from uri="+uri
    }
  },

  /** fetches the 10 most recently updated ideas */
  fetchRecentIdeas() {
    return client('/ideas/search/recentIdeas').then(res => { return res.entity._embedded.ideas })
  },

  /** lazy load all users (from cache is possible) */
  fetchAllUsers() {
    return sessionCache.load('allUsers', loadAllUsers)
  },

  /* Fetch a map from categoryId to user information of the proxy in that category */
  fetchProxyMap(user) {
    return sessionCache.load('proxyMap', fetchProxyMap, user)
  },
  
  deleteProxyMap() {
    sessionCache.deleteKey('proxyMap')
  },

  fetchOpenForVotingProposals() {
    return sessionCache.load('openForVotingProposals', loadOpenForVotingProposals)
  },

  /** 
   * The ID of a domain object in our REST HATEOS context is the full REST URI of this REST resource, e.g. http://localhost:8080/liquido/v2/areas/42
   * @return the ID of the passed model, which actually is a URI that points to a resource on our REST backend 
   */
  getId(model) {
    return model._links.self.href
  },

  findUserByEmail: findUserByEmail,
  ping: ping,
  patch: patch,
  saveIdea: saveIdea,

  /** @return the internal session cache */
  getCache() {
    return sessionCache
  }

}