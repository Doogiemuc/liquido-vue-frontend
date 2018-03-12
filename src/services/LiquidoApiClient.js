/**
 * Main client for Liquido backend API.
 * Handles users and login
 * This class is meant to be used as a singleton!
  */


// CuJoJs Rest Client  https://github.com/cujojs/rest and some of its interceptors (they are cool. That's why I decided to use this REST lib.
import rest from 'rest'
import mime from 'rest/interceptor/mime'
import errorCode from 'rest/interceptor/errorCode'
import pathPrefix from 'rest/interceptor/pathPrefix'
import basicAuth from 'rest/interceptor/basicAuth'
import uriListConverter from './uriListConverter'               // for handling Content-Type: "text/uri-list"
import logRequestsInterceptor from './logRequestsInterceptor'   // very detailed loging of all HTTP requests and responses incl. payload

import loglevel from 'loglevel'
var log = loglevel.getLogger("LiquidoApiClient");

/** Sanity check */
if (process.env.backendBaseURL === undefined) {
  throw new Error("process.env.backendBaseURL must be defined!")
}

log.debug("Creating HTTP client for server at "+process.env.backendBaseURL)

/** 
 * The CuJoJS rest client with its interceptors
 * !!!!! The order of these interceptors is EXTREMELY important !!!!!
 */
var client = rest.wrap(mime, { mime: 'application/json'} )  // then convert entity according to mime type
              //   .wrap(cachingInterceptor)      // caching interceptor must be BEFORE the mime interceptor!
                 .wrap(errorCode)               // Promise.reject() responses with http status code >= 400 
                 .wrap(logRequestsInterceptor, { logPayload: true })  // first of all log the request
                 .wrap(pathPrefix, { prefix: process.env.backendBaseURL })  // add path prefix to request


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



/**
 * Load proposals that a user liked
 * @param user currently logged in user 
 */
var loadSupportedProposals = function(user) {
  var userURI = getURI(user)
  log.debug("loadSupportedProposals(user="+user.email+")")
  return client('/laws/search/findSupported?status=PROPOSAL&user='+userURI).then(
    response => { return response.entity._embedded.laws }
  )	
}


/** 
 * Load all polls that are currently in the voting phase
 * @return a list of polls in the _embedded attribute. Each poll will already include all its proposals.
 *         Will return at least an empty array.
 */
var loadOpenForVotingPolls = function() {
  /*
  client('/laws/search/findSupported?status=PROPOSAL&user=/users/2').then(
    response => { log.info("got =", response.entity._embedded.laws) }
  )
  */
  
  return client('/polls/search/findByStatus?status=VOTING').then(
    response => { return response.entity._embedded.polls}
  )
}

/** 
 * fetch all alternative proposals of the given proposal
 * @param proposalSelector a proposal or proposal URI (not necessarily the initial proposal itself)
 * @return a list of alternative competing proposals
 */
var loadPoll = function(pollSelector) {
  log.debug("loadPoll", pollSelector)
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

/** These "global properties" are values that come from the backend */
var loadGlobalProperties = function() {
	log.debug("loading global properties")
	return client('/globalProperties').then(
	  response => { return response.entity }
	)
}



//=========================================
// Module private fields and methods
//=========================================


// The CuJoJS rest client with its interceptors
// Keep in mind that all requests to the backend must be authenticated. So you must call this.setLogin() before making the first request.
log.debug("Creating HTTP client for server at "+process.env.backendBaseURL)
var client = rest.wrap(mime, { mime: 'application/json'} )
                 .wrap(errorCode)               // Promise.reject() responses with http status code >= 400 
                 .wrap(logRequestsInterceptor)
                 .wrap(pathPrefix, { prefix: process.env.backendBaseURL })

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
 * @param model a domain model. If you already pass a valid URI as a string, then that URI will be returned as is.
 * @return the ID of the passed model, which actually is a URI that points to a resource on our REST backend 
 */
var getURI = function(model) {
  var uriRegEx = new RegExp('^'+process.env.backendBaseURL+'[\\w/]*/\\d+$')
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



//=========================================
// Public/Exported methods
//=========================================

module.exports = {

  // login a given user. Every future request will send these credentials with HTTP BasicAuth
  setLogin(username, password) {
    log.debug("User login: "+username)
    client = client.wrap(basicAuth, { username: username, password: password });
  },

  /** 
   * Check if backend is alive.
   * @return A Promise that will reject (quickly) when the backend is not reachable.
   */
  ping() {
    return client('/_ping').then(result => {
      if (result.error) return Promise.reject("Connection error: "+result.error)    //BUGFIX:  No error status is set on conction error???
      return Promise.resolve("Backend is alive")
    })
  },

  getAllUsers() {
    return client('/users').then( 
      response => { return response.entity._embedded.users }
    )
  },

  findUserByEmail(email) {
    return client('/users/search/findByEmail?email='+email).then(
      response => { return response.entity }
    )
  },

  /** lazy load all categories (from cache if possible) */
  getAllCategories() {
    return client('/areas').then(
      response => { return response.entity._embedded.areas }
    )
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



}