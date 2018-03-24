/**
 * Main client for Liquido backend API.
 * Handles users and login
 * This class is meant to be used as a singleton!
  */

import httpClient from './httpClient'
import loglevel from 'loglevel'

var log = loglevel.getLogger("LiquidoApiClient");

/** Sanity check */
if (process.env.backendBaseURL === undefined) {
  throw new Error("process.env.backendBaseURL must be defined!")
}

//==================================================================================================================
// Module private fields and methods
//==================================================================================================================

var client = httpClient.getClient()

httpClient.setCacheUrlFilter(process.env.backendBaseURL+'(/laws/search/|/globalProperties)');
httpClient.setCacheTTL(10)

/** 
 * Get the internal DB id of a model. IDs are numbers.
 * This is an internal method and should not be exposed.
 */
var getId = function(model) {
  var uri = this.getURI(model)
  var uriRegEx = new RegExp('^https?://.*/(\d?)$')
  var id = uri.match(uriRegEx)
}


//==================================================================================================================
// Public/Exported methods
//==================================================================================================================

module.exports = {

  login(username, password) {
    log.debug("LiquidoApiClient User login: "+username)
    client = httpClient.basicAuth(username,password)
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

  disableCache() {
    httpClient.setCacheUrlFilter('DO_NOT_CACHE');
  },

  enableCache() {
    // only cache requests when searching for ideas, proposals or laws
    httpClient.setCacheUrlFilter(process.env.backendBaseURL+'/laws/search/');
  },

  /** 
   * The ID of a domain object in our REST HATEOS context is the full REST URI of this REST resource, 
   * e.g. <pre>http://localhost:8080/liquido/v2/areas/42</pre>
   * @param model  a domain model. If you already pass a valid URI as a string, then that URI will be returned as is.
   * @return the ID of the passed model, which actually is a URI that points to a resource on our REST backend 
   */
  getURI(model) {
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
  },

//==================================================================================================================
// Users
//==================================================================================================================

  getAllUsers() {
    return client('/users').then( 
      res => { return res.entity._embedded.users }
    )
  },

  findUserByEmail(email) {
    return client('/users/search/findByEmail?email='+email).then(
      res => { return res.entity }
    )
  },

//==================================================================================================================
// Global Properties from backend DB
//==================================================================================================================

  // local cache of globalProperties
  // They would also be cached by our cachingInterceptor, but we want a longer TTL
  globalPropertiesCache : undefined,

  /** 
   * Global configuration properties from the backend. 
   * Values will be cached via lazy loading.
   */
  getGlobalProperties() {
    if (this.globalPropertiesCache !== undefined) return this.globalPropertiesCache;
    log.debug("Loading global properties from backend (and caching them)")
    return client('/globalProperties').then(
      res => { 
        this.globalPropertiesCache = res.entity
        return res.entity 
      }
    )
  },

  /**
   * Fetch one global property by its key
   * This method is fast, since it uses the globalPropertiesCache.
   * @param key {String} key of property. This key must exist
   * @return the value for that gey
   */
  getGlobalProperty(key) {
    var globalProperties = this.getGlobalProperties();
    return globalProperties[key];
  },

  purgeGlobalPropertiesCache() {
    this.globalPropertiesCache = undefined
  },

//==================================================================================================================
// Categories (called Ares in the backend)
//==================================================================================================================

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

//==================================================================================================================
// Proxies
//==================================================================================================================

  /** fetch all proxies of a user per area */
  getProxyMap(user) {
    var userURI = user._links.self.href
    return client(userURI+'/getProxyMap').then(
      response => { return response.entity }
    )
  },

  /** add or update a delegation from the currently logged in user to a proxy */
  saveProxy(category, proxy) {
    if (!category) throw new Error("Missing category for saveProxy()")
    if (!proxy) throw new Error("Missing proxy for saveProxy()")
    return client({
      method: 'PUT',
      path: '/saveProxy',
      headers: { 'Content-Type' : 'application/json' },
      entity: {
        area:     getURI(category),   // the ID of any model is its URI, eg.  /area/4
        toProxy:  getURI(proxy)
      }
    })
  },

  /** remove the proxy of the currently logged in user in the given category */
  removeProxy(category) {
    if (!category) throw new Error("Missing category for removeProxy()")
    return client({
      method: 'DELETE', 
      path:   process.env.backendBaseURL+'/deleteProxy/'+getId(category),
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    })
  },

//==================================================================================================================
// Ideas
//==================================================================================================================

  /**
   * Get all ideas, propsals or laws (paged)
   * @param status IDEA|PROPOSAL|LAW
   * @return list of ideas, proposals or laws 
   */
  findByStatus(status) {
    log.debug("findByStatus(status="+status+")")
    return client('/laws/search/findByStatus?status='+status)
    .then(res => { return res.entity._embedded.laws })
    .catch(err => {
      log.error("ERROR in apiClient: ", JSON.stringify(err))
      return Promise.reject("LiquidoApiClient: Cannot findByStatus(status="+status+")")
    })
  },

  /**
   * Load proposals that a user liked
   * @param status IDEA, PROPOSAL or LAW
   * @param user URI of a user or a user object
   */
  findSupportedBy(user, status) {
    var userURI = this.getURI(user)     
    log.debug("findSupportedBy(user="+userURI+")")
    return client('/laws/search/findSupportedBy?status='+status+'&user='+encodeURIComponent(userURI))   //BUGFIX: Need to encode URI otherwise rest client gets confued.  THIS STOLE ME A WEEK ARGL!!! :-(
    .then(res => { return res.entity._embedded.laws })
    .catch(err => {
      log.error("ERROR in apiClient: ", JSON.stringify(err))
      return Promise.reject("LiquidoApiClient: Cannot findSupportedBy(user="+userURI+")")
    })
    
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
   * @param {String} (optional) since date in the format "yyyy-MM-dd"
   * @return {Promise} (a Promise that will resolve to) a list of LawModels of type == IDEA
   */
  getRecentIdeas(since) {
    log.debug("getRecentIdeas("+since+")")
    return client({
      path: '/laws/search/recentIdeas',
      params: { 'since': since }
    })
    .then(res => { return res.entity._embedded.laws })
    .catch(err => {
      log.error("ERROR in apiClient: ", JSON.stringify(err))
      return Promise.reject("LiquidoApiClient: Cannot getRecentIdeas(since="+since+"): "+JSON.stringify(err))
    }) 
  },

  

  /**
   * get proposals that reached their quorum since a given date.
   * @param since date in the format "yyyy-MM-dd"
   */
  getReachedQuorumSince(since) {
    log.debug("getReachedQuorumSince("+since+")")
    return client('/laws/search/reachedQuorumSince?since='+since)
    .then(res => { return res.entity._embedded.laws })
    .catch(err => {
      log.error("ERROR in apiClient: ", JSON.stringify(err))
      return Promise.reject("LiquidoApiClient: Cannot getReachedQuorumSince(since="+since+")")
    })
  },


//==================================================================================================================
// Polls
//==================================================================================================================



  /**
   * get polls that are currently in their voting phase
   * @return a list of polls that can be voted on
   */
  getOpenForVotingPolls() {
    log.debug("getOpenForVotingPolls()")
    return client('/polls/search/findByStatus?status=VOTING')
    .then(
      response => { return response.entity._embedded.polls }
    )
    .catch(err => {
      log.error("ERROR in LiquidoApiClient: ", JSON.stringify(err))
      return Promise.reject("LiquidoApiClient: Cannot getOpenForVotingPolls()")
    }) 
  },



  /** 
   * Get a poll with all its proposals
   * @param pollSelector a poll or a poll URI
   * @return a poll as JSON
   */
  getPoll(pollSelector) {
    log.debug("loadPoll", pollSelector)
    var pollURI = this.getURI(pollSelector)
    return client(pollURI)
    .then(res => { return res.entity })
    .catch(err => {
      log.error("ERROR in LiquidoApiClient: ", JSON.stringify(err))
      return Promise.reject("LiquidoApiClient: Cannot getPoll()")
    }) 
  },

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
  postBallot(newBallot) {
    log.debug("postBallot: "+JSON.stringify(newBallot))
    return client({
      method: 'POST',
      path: '/postBallot',
      headers: { 'Content-Type' : 'application/json' },
      entity: newBallot
    })
    .then(response => { return response.entity })
    .catch(err => {
      log.error("ERROR in LiquidoApiClient: ", JSON.stringify(err))
      return Promise.reject("LiquidoApiClient: Cannot postBallot()")
    }) 
  },

}