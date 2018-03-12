/**
 * Client for Liquido backend API for LawModels (ideas, proposals and laws)
 *
 * @version 2.0 This is the new REST client with cachingInterceptor.js
 *
 * This is the client side for the spring data jpa rest data repository in
 * org.doogie.liquido.datarepos.LawRepo
 *
 * This class is meant to be used as a singleton!
 *
 */

//TODO:  'require' this in the main LiquidoApiClient, so that the exported methods get merged into $root.api ref
//The same was as cujorestjs does it here in this example: https://github.com/cujojs/rest/blob/master/browser.js
 
// CuJoJs Rest Client  https://github.com/cujojs/rest and some of its interceptors (they are cool. That's why I decided to use this REST lib.
import rest       from 'rest'
import mime       from 'rest/interceptor/mime'
import errorCode  from 'rest/interceptor/errorCode'
import pathPrefix from 'rest/interceptor/pathPrefix'
import basicAuth  from 'rest/interceptor/basicAuth'
import cachingInterceptor     from './cachingInterceptor'       // cache requests by URL (with TTL)
import logRequestsInterceptor from './logRequestsInterceptor'   // very detailed loging of all HTTP requests and responses incl. payload

import loglevel from 'loglevel'
var log = loglevel.getLogger("IdeaAndProposalApiClient");

//==================================================================================================================
// Initialize and setup
//==================================================================================================================

/** Sanity check */
if (process.env.backendBaseURL === undefined) {
  throw new Error("process.env.backendBaseURL must be defined!")
}

/** 
 * The CuJoJS rest client with its interceptors
 * !!!!! The order of these interceptors is EXTREMELY important !!!!!
 */
var client = rest.wrap(mime, { mime: 'application/json'} )  // then convert entity according to mime type
                 .wrap(cachingInterceptor)      // caching interceptor must be BEFORE the mime interceptor!
                 .wrap(errorCode)               // Promise.reject() responses with http status code >= 400 
                 .wrap(logRequestsInterceptor, { logPayload: true })  // first of all log the request
                 .wrap(pathPrefix, { prefix: process.env.backendBaseURL })  // add path prefix to request
                 
                 
// Keep in mind that all requests to the backend must be authenticated. So you must call this.setLogin() before making the first request.

//==================================================================================================================
// Module private methods
//==================================================================================================================

/** 
 * Get the internal DB id of a model. Those IDs are numbers.
 * This is an internal method and should not be exposed.
 */
var getInternalId = function(model) {
  var uri = this.getURI(model)
  var uriRegEx = new RegExp('^https?://.*/(\d?)$')
  var id = uri.match(uriRegEx)
}

/** 
 * The unique identifier of a domain object in our REST HATEOS context is the full REST URI of this REST resource, e.g.
 *   http://localhost:8080/liquido/v2/areas/42
 * The server understands full and relative pathes. So just simply '/areas/42' also works as an identifier.
 * You might want to <pre>encodeURIComponent(uri)</pre> when you want to pass the returned uri as a path parameter.
 *
 * @param model a domain model. If you already pass a valid URI as a string, then that URI will be returned as is.
 * @return the URI of the passed model that points to the resource on our REST backend 
 */
var getURI = function(model) {
  //TODO: check if passed model is a string or an object
  var uriRegEx = new RegExp('^'+process.env.backendBaseURL+'[\\w/]*/\\d+$')   //TODO: relative urls are also OK
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



//==================================================================================================================
// Public/Exported methods
//==================================================================================================================

module.exports = {
  
  /** 
   * login a given user. Every future request will send these credentials with HTTP BasicAuth.
   * You MUST call this before you can use any other mehtod in this module!
   */
  setLogin(username, password) {
    log.debug("User login: "+username)
    client = client.wrap(basicAuth, { username: username, password: password });
  },
  
  /**
   * save a new(!) idea in the backend
   * The new idea will automatically be createdBy the currently logged in user.
   */
  saveIdea(newIdea) {
    log.debug("POST newIdea: "+JSON.stringify(newIdea))
    return client({
      method: 'POST',
      path:   '/laws',
      headers: { 'Content-Type' : 'application/json' },
      entity: newIdea
    }).then(res => { 
      return res.entity 
    }).catch(err => {
      log.error("Cannot post newIdea:"+JSON.stringify(newIdea)+" :", err)
      return Promise.reject(err)
      //throw new Error(err)
    })
  },

  /** 
   * Update some fields of an existing(!) idea, proposal or law.
   * @param URI the absolute REST path to the resource on the server. 
   * @param the fields that shall be updated. (Does not need to contain all fields.)
   * @return the response sent from the server which is normally the complete updated resource with all its fields.
   */
  patchIdea(uri, update) {
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
  },

  // add user as a supporter to an idea
  addSupporterToIdea(idea, user) {
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
  },

  /** 
   * get recently created ideas
   * @param since date in the format "yyyy-MM-dd"
   * @return (a Promise that will resolve to) a list of LawModels of type == IDEA
   */
  getRecentIdeas(since) {
    log.debug("getRecentIdeas("+since+")")
    var requestURL = '/laws/search/recentIdeas'
    if (since !== undefined) {
      requestURL += "?since="+since
    }
    return client(requestURL)
    .then(res => {
      return res.entity._embedded.laws
    })
    .catch(err => {
      log.error("ERROR in apiClient: ", JSON.stringify(err))
      return Promise.reject("IdeaAndProposalApiClient: Cannot getRecentIdeas(since="+since+"): "+JSON.stringify(err))
    }) 
  },
  
  /**
   * Get all ideas, propsals or laws (paged)
   * @param status IDEA|PROPOSAL|LAW
   * @return list of ideas, proposals or laws 
   */
  findByStatus(status) {
    log.debug("findByStatus(status="+status+")")
    return client('/laws/search/findByStatus?status='+status)
    .then(res => { 
      return res.entity._embedded.laws
    })
    .catch(err => {
      log.error("ERROR in apiClient: ", JSON.stringify(err))
      return Promise.reject("IdeaAndProposalApiClient: Cannot findByStatus(status="+status+")")
    })
  },

  /**
   * get proposals that reached their quorum since a given date.
   * @param since date in the format "yyyy-MM-dd"
   */
  getReachedQuorumSince(since) {
    log.debug("getReachedQuorumSince("+since+")")
    return client('/laws/search/reachedQuorumSince?since='+since)
    .then(res => { 
      return res.entity._embedded.laws
    })
    .catch(err => {
      log.error("ERROR in apiClient: ", JSON.stringify(err))
      return Promise.reject("IdeaAndProposalApiClient: Cannot getReachedQuorumSince(since="+since+")")
    })
  },

  /**
   * Load proposals that a user liked
   * @param user URI of a user or a user object
   */
  findSupportedBy(user) {
    var userURI = getURI(user)     
    log.debug("findSupportedBy(user="+userURI+")")
    return client('/laws/search/findSupportedBy?status=PROPOSAL&user='+encodeURIComponent(userURI))   //BUGFIX: Need to encode URI otherwise rest client gets confued.  THIS STOLE ME A WEEK ARGL!!! :-(
    .then(
      response => { return response.entity._embedded.laws }
    )
    .catch(err => {
      log.error("ERROR in apiClient: ", JSON.stringify(err))
      return Promise.reject("IdeaAndProposalApiClient: Cannot findSupportedBy(user="+userURI+")")
    })
    
  },




}