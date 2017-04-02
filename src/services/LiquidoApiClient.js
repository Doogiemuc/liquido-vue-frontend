/**
 * Client for Liquido backend API.
 *
 * This class is responsible for abstracting from the actual REST interface.
 * It tries to abstract from the internal ID representation as far as possible.
 * Our backend sends URIs as IDs for model objects. 
 *
 * This class is meant to be used as a singleton!
 */


//Implementation note: 
//The server sends "areas". Here on the client we rename them to "categories".
//But there is one catch: The inlined child references coming from the server are still named "areas".
//But I wanted to test the  separation between client and server. So I use this as a test case. Maybe also a preview on future localisation support

// CuJoJs Rest Client  https://github.com/cujojs/rest
// and some of its interceptors (they are cool. That's why I decided to use this REST lib.
//import _ from 'lodash'  
import rest from 'rest'
import mime from 'rest/interceptor/mime'
import errorCode from 'rest/interceptor/errorCode'
import pathPrefix from 'rest/interceptor/pathPrefix'
import basicAuth from 'rest/interceptor/basicAuth'
import uriListConverter from './uriListConverter'               // for handling Content-Type: "text/uri-list"
import logRequestsInterceptor from './logRequestsInterceptor'   // deteiled log of HTTP requests and responses
//MAYBE: import hateoas from 'rest/interceptors/hateoas'      // Hypermedia AS the Engine of State HATEOAS. Test this. Could be useful with spring-hateoas.
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
// Keep in mind that all requests to the backend must be authenticated. So you must call this.setLogin() before making the first request.
var client = rest.wrap(mime, { mime: 'application/json'} )
                 .wrap(errorCode)               // Promise.reject() responses with http status code >= 400 
                 .wrap(pathPrefix, { prefix: process.env.backendBaseURL })
                 .wrap(logRequestsInterceptor)


/** 
 * Get the internal DB id of a model. IDs are numbers.
 * This is an internal method and should not be exposed.
 */
var getId = function(model) {
  var uri = this.getURI(model)
  var uriRegEx = new RegExp('^https?://.*/(\d?)$')
  var id = uri.match(uriRegEx)
}

/** 
 * The ID of a domain object in our REST HATEOS context is the full REST URI of this REST resource, 
 *   e.g. http://localhost:8080/liquido/v2/areas/42
 * This method is exposed to the web app.
 * @param model a domain model. If you already pass a valid URI as a string, then that URI will be returned as is.
 * @return the ID of the passed model, which actually is a URI that points to a resource on our REST backend 
 */
var getURI = function(model) {
  var uriRegEx = new RegExp('^'+process.env.backendBaseURL+'\\w*/\\d+$')
  if (uriRegEx.test(model)) {
    return model
  } else {
    try {
    	var uri = model._links.self.href     // this will fail if that json path does not exist, ie. model wasn't a HATEOS object
    	//TODO: remove "{?projection}" from the end
      return uri    
    } catch (err) {
      throw new Error("Cannot get URI of "+ model+" : "+err)
    }
  }
}

/** 
 * Check if backend is alive.
 * @return A Promise that will reject (quickly) when the backend is not reachable.
 */
var ping = function() {
  return client('/_ping').then(result => {
    if (result.error) return Promise.reject("Connection error: "+result.error)    //BUGFIX:  No error status is set on conction error???
    return Promise.resolve("Backend is alive")
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
    headers: { 'Content-Type' : 'application/json' },
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
  if (!uri.startsWith('http')) throw new Error("ERROR in patch: URI must start with http(s)! wrong_uri="+uri)
  if (!update) log.warn("WARNING: PATCH called with empty update")
  return client({ 
    method: 'PATCH', 
    path:   uri, 
    headers: { 'Content-Type' : 'application/json' },
    entity: update
  }).then(res => { 
    return res.entity 
  }).catch(err => {
    log.error("Cannot patch "+uri+" : "+err)
    throw new Error(err)
  })
}

// add user as a supporter to an idea
var addSupporter = function(idea, user) {
  if (!idea || !user) throw new Error("Cannot add Supporter. Need idea and user!")
  var supportersURI = idea._links.supporters.href
  var userURI       = this.getURI(user)
  log.debug("Add Supporter "+user.email+" ("+userURI+") to idea '"+idea.title+"': POST "+supportersURI)
  return client({
    method: 'POST',
    path:   supportersURI,
    headers: { 'Content-Type' : 'text/uri-list' },  //BUGFIX for "no String-argument constructor/factory method to deserialize from String value"   send text/uri-list !
    entity: userURI
  }).then(res => {
    // returns status 204
    log.debug("added Supporter successfully.")
    return ""
  }).catch(err => {
    log.error("Cannot addSupporter: "+supportersURI+": ", err)
    throw new Error(err)
  })
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

/** add or update a delegation from the currently logged in user to a proxy */
var saveProxy = function(category, proxy) {
  if (!category) throw new Error("Missing category for saveProxy()")
  if (!proxy) throw new Error("Missing proxy for saveProxy()")
  return client({
    method: 'PUT',
    path: '/saveProxy',
    headers: { 'Content-Type' : 'application/json' },
    entity: {
      area:     this.getURI(category),   // the ID of any model is its URI, eg.  /area/4
      toProxy:  this.getURI(proxy)
    }
  })
}

/** remove the proxy of the currently logged in user in the given category */
var removeProxy = function(category) {
  if (!category) throw new Error("Missing category for removeProxy()")
  return client({
    method: 'DELETE',
    path:   process.env.backendBaseURL+'/deleteProxy/'+this.getId(category),
    headers: { 
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  })
}

var findUserByEmail = function(email) {
  return client('/users/search/findByEmail?email='+email).then(
    response => { return response.entity }
  )
}

/** 
 * Load all polls that are currently in the voting phase
 * @return a list of polls in the _embedded attribute. Each poll will already include all its proposals.
 *         Will return at least an empty array.
 */
var loadOpenForVotingPolls = function() {
  return client('/polls/search/findByStatus?status=VOTING').then(
    response => { return response.entity._embedded.polls}
  )
}

/** 
 * fetch all alternative proposals of the given proposal
 * @param proposalSelector a proposal or proposal URI (not necessarily the initial proposal itself)
 * @return a list of alternative competing proposals
 */
var fetchPoll = function(pollSelector) {
  log.debug("fetchPoll", pollSelector)
  var pollURI = this.getURI(pollSelector)
  return client(pollURI).then(
    response => { return response.entity }
  )
  /*
  return client('/laws/search/findCompeting?proposal='+proposalURI).then(
    response => { return response.entity._embedded.laws }
  )
  */
}

/** called when a user casts a vote. Will either insert a new ballot or update the existing one .
 * Exmaple payload for newBallot:
 *   {
 *    "initialProposal": "/liquido/v2/laws/42",
 *     "voteOrder": [
 *       "/liquido/v2/laws/42",
 *       "/liquido/v2/laws/43"
 *     ]
 *   }
 */
var postBallot = function(newBallot) {
	log.debug("postBallot: "+JSON.stringify(newBallot))
  return client({
    method: 'POST',
    path: '/postBallot',
    headers: { 'Content-Type' : 'application/json' },
    entity: newBallot
  })
	.then(
	  response => { return response.entity }
	)
}

var loadGlobalProperties = function() {
	log.debug("loading global properties")
	return client('/globalProperties').then(
	  response => { return response.entity }
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

  getCategory(uri) {
    var areaRegEx = new RegExp('^https?://.*/areas/(\w?)$')           // categories are called areas on the server
    if (areaRegEx.test(uri)) {
      return client({path: uri}).then(res => {return res.entity })
    } else if (!isNaN(uri)) {
      return client('/areas/'+uri).then(res => {return res.entity })    // idea ID was passed as a number
    } else {
      throw "Cannot get Category from uri="+uri
    }
  },

  /** lazy load all ideas */
  fetchAllIdeas() {
    return sessionCache.load('allIdeas', loadAllIdeas)
  },

  /** 
   * (re)load one idea from the backend
   * @param ideaSelector the URI of an idea from the backend. Or you can also pass an already known idea, that needs to be reloaded.
   * @return the idea with createdBy and area inlined
   */
  getIdea(ideaSelector) {
    var ideaUri = this.getURI(ideaSelector)
    return client({path: ideaUri+'?projection=ideaProjection'}).then(res => {return res.entity })
  },

  getProposal(proposalSelector) {
    var proposalUri = this.getURI(proposalSelector)
    return client({path: proposalUri}).then(res => {return res.entity })
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

  fetchOpenForVotingPolls() {
    return sessionCache.load('openForVotingPolls', loadOpenForVotingPolls)
  },
  
  fetchGlobalProperties() {
  	return sessionCache.load('globalProperties', loadGlobalProperties)
  },
  
  /** @return the internal session cache */
  getCache() {
    return sessionCache
  },

  ping: ping,
  getURI: getURI,
  patch: patch,
  findUserByEmail: findUserByEmail,
  addSupporter: addSupporter,
  saveIdea: saveIdea,
  saveProxy: saveProxy,
  removeProxy: removeProxy,
  fetchPoll: fetchPoll,
  postBallot: postBallot

}