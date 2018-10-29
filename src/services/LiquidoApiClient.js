/**
 * API client  for the Liquido backend. This class is the central facade for all API methods.
 * Every call to the backend comes through here. LiquidoApiClient handles:
 *  - oauth authentication
 *  - caching of requests
 *  - error handling
 * Under the hood REST requests are sent with AXIOS
 *
 * Error handling
 * All API functions return a Promise. When the HTTP operation fails, then this promise will reject
 * with an error message.
 */

// I know this module is too large for one file. I started to split it up several times. But in the end
// I personally had the best coding experience when everything was in one file.

var qs = require('qs');  // A querystring parsing and stringifying library with some added security.
var template = require('url-template');   // parsing and expanding RFC 6570 URI Templates
var loglevel = require('loglevel')
var log = loglevel.getLogger("LiquidoApiClient");


//==================================================================================================================
// Module private fields and methods
//==================================================================================================================

// Sanity check
if (process.env.backendBaseURL === undefined) {
  throw new Error("process.env.backendBaseURL must be defined!")
}

// Configure Axios HTTP Client
const axios = require('axios')
const anonymousClient = axios.create()      // extra client instance for anonymous unauthenticated requests
axios.defaults.baseURL = process.env.backendBaseURL

// currently logged in user. Will be set in login
var oauthParams = {
  grant_type: 'password',
  client_id: 'liquidoclientid',
  client_secret: 'liquido.slient:secret5',
  username: undefined,
  password: undefined,
  scope: ''
}

// cached Oauth token. Will be set in login
var oauthToken = undefined
const myInterceptor = axios.interceptors.request.use(function (config) {
  if (oauthToken !== undefined) {
    config.headers['Authorization'] = 'Bearer '+oauthToken
  }
  return config
});

// local cache of globalProperties
// They would also be cached by our cachingInterceptor, but we want a longer TTL
var globalPropertiesCache = undefined


//==================================================================================================================
// Public/Exported methods
//==================================================================================================================

module.exports = {

  getOAuthtoken(username, password) {
    oauthParams.username = username
    oauthParams.password = password
    return axios.post('/oauth/token', qs.stringify(oauthParams))
      .then(res => {
        oauthToken = res.data.access_token
        log.debug("Received oauth token", oauthToken)
        return oauthToken
      })
      .catch(err => {
        log.error("Cannot get Oauth token", err)
        return Promise.reject(err)
      })
  },

  /**
   * Login this user
   * @return full user object or Promise.reject() on error
   */
  login(username, password) {
    log.info("LiquidoApiClient User login: " + username)
    return this.getOAuthtoken(username, password)
      .then(res => {
        return this.findUserByEmail(username)
      })
  },

  logout() {
    oauthToken = undefined
    //TODO: flush the cache
  },

  /** send a link to login via email */
  sendMagicLink() {
    return Promise.resolve("/loginWithToken?token=ABCDEF")
  },

  /** send a login code via SMS */
  sendSmsLoginCode(phone) {
    return axios.get('/login/sendSmsLoginCode?phone='+phone)
  },

  /** verify if a 4-digit login code is valid */
  verifySmsLoginCode(code) {
    return axios.get('/login/verifySmsLoginCode?code='+code).then(res => {
      this.$root.currentUser = res
      this.$root.currentUserURI = res._links.self.href
      return res
    })
  },

  /**
   * Check if backend is alive.
   * @return A Promise that will reject (quickly) when the backend is not reachable.
   */
  ping() {
    return anonymousClient.get('/_ping').then(result => {
      if (result.error) return Promise.reject("Connection error: "+result.error)    //BUGFIX:  No error status is set on conection error???
      return Promise.resolve("Backend is alive")
    })
  },

  //TODO: do i need client side caching at all? => well it is for example nice for client side filtering. => Cache in table?

	/** disable the cache. Every request will go the backend */
  disableCache() {
    //log.debug("disableCache")
    //httpClient.setCacheUrlFilter('DO_NOT_CACHE')
  },

	/** enable cache when searching for laws */
  enableCache(){
    //log.debug("enableCache")
		// only cache requests when searching for ideas, proposals or laws   and for globalProperties
		//httpClient.setCacheUrlFilter(process.env.backendBaseURL+'(/laws/search/|/globalProperties)');
		//httpClient.setCacheTTL(10)
	},

	/** disable the cache but only for the next request */
  noCacheForNextRequest() {
    //httpClient.noCacheForNextRequest()
  },

  /**
   * The ID of a domain object in our REST HATEOS context is the full REST URI of this REST resource,
   * e.g. <pre>http://localhost:8080/liquido/v2/areas/42</pre>
   * @param {String|Object} model If you already pass a valid URI as a string, then that URI will be returned as is.
   *        Otherwise you can also pass a model that you loaded before. Then its _links.self.href will be returned.
   * @return {URI} an URI that points to a resource on our REST backend
   */
  getURI(model) {
    var uriRegEx = new RegExp('^'+process.env.backendBaseURL+'[\\w/]*/\\d+$')
    if (uriRegEx.test(model)) {
      return model
    } else {
      try {
        var uri = model._links.self.href     // this will fail if that json path does not exist, ie. model wasn't a HATEOS object
        if (uri.endsWith("{?projection}")) {
          uri = uri.slice(0, -13);    //remove "{?projection}" from the end  !!!
        }
        return uri
      } catch (err) {
				console.log("Cannot get URI of ", model, err)
        throw new Error("Cannot get URI of "+model+": "+err)
      }
    }
  },

  //MAYBE: getModelById(id, modelClass),  e.g   getModelById(4711, 'laws') => process.env.backendBaseURL + '/' + modelClass + '/' + id

//==================================================================================================================
// HATEOAS
//==================================================================================================================

  //TODO: this would be a nice generic way of navigating hateoas links
  follow(hateosJson, linkName, uriTemplateParams) {
    var link = hateosJson._links[linkName]
    if (link === undefined) return Promise.reject("Cannot find link with name "+linkName)
    //replace uri template variables in href   e.g. with https://www.npmjs.com/package/url-template
    var url = link.href.expand(uriTemplateParams)
    // make call
    return axios.get(url)  // might return just one entity or an array of entities
  },



//==================================================================================================================
// Users
//==================================================================================================================

  getAllUsers() {
    return axios.get('/users').then(
      res => { return res.data._embedded.users }
    )
  },

  findUserByEmail(email) {
    return axios.get('/users/search/findByEmail?email='+email)
     .then(res => {
      return res.data
    })
    .catch(err => {
      return Promise.reject({msg: "Cannot findUserByEmail", email: email, err: err})
    })
  },

//==================================================================================================================
// Global Properties from backend DB
//==================================================================================================================


  /**
   * Global configuration properties from the backend.
   * Values will be cached via lazy loading.
   */
  getGlobalProperties() {
    if (globalPropertiesCache !== undefined) return globalPropertiesCache;
    log.debug("Loading global properties from backend (and caching them)")
    return anonymousClient.get('/globalProperties').then(
      res => {
        globalPropertiesCache = res.data
        return res.data
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
    return axios.get('/areas').then(
      response => { return response.data._embedded.areas }
    )
  },

  getCategory(uri) {
    var areaRegEx = new RegExp('^https?://.*/areas/(\w?)$')           // categories are called areas on the server
    if (areaRegEx.test(uri)) {
      return axios.get(uri).then(res => {return res.data })
    } else if (!isNaN(uri)) {
      return axios.get('/areas/'+uri).then(res => {return res.data })    // idea ID was passed as a number
    } else {
      throw "Cannot get Category from uri="+uri
    }
  },

//==================================================================================================================
// Proxies
//==================================================================================================================

  /** fetch all proxies of a user per area */
  getProxyMap(user) {
    return axios.get('/my/proxyMap').then(
      response => { return response.entity }
    )
  },

  /** add or update a delegation from the currently logged in user to a proxy */
  assignProxy(category, proxy) {
    if (!category) throw new Error("Missing category for saveProxy()")
    if (!proxy) throw new Error("Missing proxy for saveProxy()")
    var categoryURI = this.getURI(category)
    var proxyURI = this.getURI(proxy)
    log.debug("assignProxy(categor="+categoryURI+", proxy="+proxyURI+")")
    return client.put({
      url: '/assignProxy',
      headers: { 'Content-Type' : 'application/json' },
      data: {
        area:     categoryURI,
        toProxy:  proxyURI
      }
    })
  },

  /** remove the proxy of the currently logged in user in the given category */
  removeProxy(category) {
    if (!category) throw new Error("Missing category for removeProxy()")
    var categoryURI = this.getURI(category)
    log.debug("removeProxy(category="+categoryURI+")")
    return axios.delete({
      url: '/deleteProxy/'+category.id,
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
	 * reload one proposal from server (without using the cache)
	 * @param {string|object} lawIdOrURI ID or URI of an idea, proposal or law
	 * @param {boolean} projected wether to return the projected ("extended") JSON with area and createdBy expanded.
	 * @return {object} the reloaded idea as HATEOS JSON
	 */
	getLaw(lawIdOrURI, projected) {
    var lawURI
    if (!isNaN(lawIdOrURI)) lawURI = process.env.backendBaseURL+'/laws/'+lawIdOrURI
    else lawURI = this.getURI(lawIdOrURI)
    if (projected) lawURI += "?projection=lawProjection"
		log.debug("getLaw()", lawURI)
    //httpClient.noCacheForNextRequest()
    return axios.get(lawURI).then(res => {
      return res.data
    }).catch(err => {
      log.error("Cannot getLaw("+JSON.stringify(lawURI)+") :", err)
      return Promise.reject({msg: "Cannot get law", lawURI: lawURI, httpStatusCode: err.status.code})
      //throw new Error(err)  NO! See https://stackoverflow.com/questions/33445415/javascript-promises-reject-vs-throw
    })
  },

  getIdea(ideaIdOrURI, projected) {
    return this.getLaw(ideaIdOrURI, projected)
  },

  /**
   * Get all ideas, propsals or laws (paged)
   * @param {string} status IDEA|PROPOSAL|LAW
	 * @param {number} page number of page to load
	 * @param {size}   size length of one page
	 * @param {string} sort <name of attribute>[,asc|desc]
   * @return paged list of ideas, proposals or laws
   */
  findByStatus(status, page, size, sort) {
    log.debug("findByStatus(status="+status+")")
    return axios.get('/laws/search/findByStatus', {
			params: {
				status: status,
				page: page,
				size: size,
				sort: sort
			}
		})
    .then(res => { return res.data._embedded.laws })
    .catch(err => { return Promise.reject("LiquidoApiClient: Cannot findByStatus(status="+status+")", err) })
  },

  /**
   *
   */
  findByStatusAndCreator(status, creator) {
    log.debug("findByStatusAndCreator(status='"+status+"', creator.id="+creator.id+")")
    return axios.get('/laws/search/findByStatusAndCreator', {
        params: {
          status: status,
          user: this.getURI(creator)
        }
      })
      .then(res => { return res.data._embedded.laws })
      .catch(err => { return Promise.reject({msg: "LiquidoApiClient: Cannot findByStatusAndCreator", status: status, creator: creator, err: err}) })
  },

  /**
   * Load proposals that a user liked
   * @param status IDEA, PROPOSAL or LAW
   * @param user URI of a user or a user object
   */
  findSupportedBy(user, status) {
    var userURI = this.getURI(user)
    log.debug("findSupportedBy(user="+userURI+", status="+status+")")
    return axios.get('/laws/search/findSupportedBy', {
      params: {
        status: status,
        user: userURI
      }
    })
    .then(res => { return res.data._embedded.laws })
    .catch(err => { return Promise.reject({msg: "LiquidoApiClient: Cannot findSupportedBy()", user: user, status: status, err: err})  })
  },

  /**
   * save a new(!) idea in the backend
   * The new idea will automatically be createdBy the currently logged in user.
   */
  saveNewIdea(newIdea) {
    log.debug("POST newIdea: "+JSON.stringify(newIdea))
    return axios.post({
      url: '/laws',
      headers: { 'Content-Type' : 'application/json' },
      data: newIdea
    }).then(res => {
      return res.data
    }).catch(err => {
      log.error("Cannot post newIdea:"+JSON.stringify(newIdea)+" :", err)
      return Promise.reject(err)
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
    if (!uri.startsWith('http')) return Promise.reject("ERROR in patchIdea: URI must start with http(s)! wrong_uri="+uri)
    if (!update) return Promise.reject("patchIdea called with empty update")
    return axios({
      method: 'PATCH',
      path: uri,
      headers: { 'Content-Type' : 'application/json' },
      data: update
    }).then(res => {
      return res.data
    }).catch(err => {
      log.error("Cannot patch "+uri+" : "+err)
      return Promise.reject(err)
    })
  },

  /**
   * add user as a supporter to an idea
   * @param {Object} idea the idea that the user likes
   * @param {Object} user the user that likes to discuss this idea
   * @return Just HTTP status 204
   */
  addSupporterToIdea(idea, user) {
    if (!idea || !user) throw new Error("Cannot add Supporter. Need idea and user!")
    var supportersURI = idea._links.supporters.href
    var userURI       = this.getURI(user)
    log.debug(user.profile.name+" ("+user.email+") now supports idea("+idea.id+") '"+idea.title+"': POST "+supportersURI)
    return axios({
      method: 'POST',
      url:   supportersURI,
      headers: { 'Content-Type' : 'text/uri-list' },  //BUGFIX for "no String-argument constructor/factory method to deserialize from String value"   send text/uri-list !
      data: userURI
    }).then(res => {
      return ""  // backend returns status 204
    }).catch(err => {
      log.error("Cannot addSupporter: "+supportersURI+": ", err)
      return Promise.reject(err)
    })
  },

  /**
   * get recently created ideas
   * @param {String} (optional) since date in the format "yyyy-MM-dd"
   * @return {Promise} (a Promise that will resolve to) a list of LawModels of type == IDEA
   */
  getRecentIdeas() {
    log.debug("getRecentIdeas()")
    return axios.get('/laws/search/recentIdeas')
			.then(res => { return res.data._embedded.laws })
			.catch(err => {
				log.error("ERROR in apiClient: ", JSON.stringify(err))
				return Promise.reject("LiquidoApiClient: Cannot getRecentIdeas(since="+since+"): "+JSON.stringify(err))
			})
  },

//==================================================================================================================
// Proposals
//==================================================================================================================

  /**
   * get proposals that reached their quorum since a given date.
   * @param since date in the format "yyyy-MM-dd"
   */
  getReachedQuorumSince(since) {
    log.debug("getReachedQuorumSince("+since+")")
    return axios.get('/laws/search/reachedQuorumSince?since='+since)
    .then(res => { return res.data._embedded.laws })
    .catch(err => {
      log.error("ERROR in apiClient: ", JSON.stringify(err))
      return Promise.reject("LiquidoApiClient: Cannot getReachedQuorumSince(since="+since+")")
    })
  },

  /**
   * Fetch a proposal (which is also a LawModel)
   */
  getProposal(proposalOrURI, projected) {
    return this.getLaw(proposalOrURI, projected)
  },


  /** fetch all comments of a proposal */
  getComments(proposal, projected) {
    var commentsTemplate = template.parse(proposal._links.comments.href)
    var commentsURL = commentsTemplate.expand({
      projection: projected ? 'commentProjection' : undefined
    })
    log.debug("getComments for Proposal: "+commentsURL)
    return axios.get(commentsURL)
      .then(res => { return res.data._embedded.comments })
      .catch(err => { return Promise.reject("LiquidoApiClient: Cannot getComments(proposal.id="+proposal.id+"): "+err) })
  },

  /**
    * Upvote a comment of a proposal. Will add current user to the list of upvoters. Backend will not add an upvoter twice.
    * @param comment a comment model (JSON with comment._links.upVoters.href)
    * @return Promise (HTTP 204)
    */
  upvoteComment(comment, user) {
    var upvotersURI = comment._links.upVoters.href   // e.g. /comments/4711/upVoters
    var userURI       = this.getURI(user)
    log.debug("upvoteComment", upvotersURI, userURI)
    return axios({
      method: 'POST',
      url: upvotersURI,
      headers: { 'Content-Type' : 'text/uri-list' },
      data: userURI
    })
    .catch(err => { return Promise.reject({msg: "LiquidoApiClient: Cannot upvoteComment", comment: comment, err: err}) })
  },

  /** mark a comment as inapropriate */
  downvoteComment(comment, user) {
    var downvotersURI = comment._links.downVoters.href   // e.g. /comments/4711/downVoters
    var userURI       = this.getURI(user)
    log.debug("downvoteComment", downvotersURI, userURI)
    return axios({
      method: 'POST',
      url: downvotersURI,
      headers: { 'Content-Type' : 'text/uri-list' },
      data: userURI
    })
    .catch(err => { return Promise.reject({msg: "LiquidoApiClient: Cannot downvoteComment", comment: comment, err: err}) })
  },

  /**
   * save a new comment (will automatically be createdBy currently logged in user)
   * @param newCommentText text of new comment
   * @param parent parent comment
   */
  saveComment(newCommentText, parent) {
    var newComment = { comment: newCommentText }
    if (parent) newComment['parent'] = parent._links.self.href
    log.debug("saveComment", newComment)
    return axios({
      method: 'POST',
      url: '/comments',
      headers: { 'Content-Type' : 'application/json' },
      data: newComment
    })
    .catch(err => { return Promise.reject({msg: "LiquidoApiClient: Cannot saveComment", newComment: newComment, err: err}) })
  },

  /**
   * add a new suggestion for improvement to a proposal
   * This method first creates a new "comment" and then links this as a new suggestion to the passed proposal
   * @param {String} newImprovementText plain-text of suggestion
   * @param {Object} proposal the proposal that we want to improve
   */
  suggestImprovement(newImprovementText, proposal) {
    if (!proposal) return new Promise.reject({msg: "Need proposal to suggest improvement"})
    log.debug("suggestImprovement for proposal", proposal)
    return this.saveComment(newImprovementText, null)
    .then(res => {
      var createdComment = res.data
      return axios({
        method: 'POST',   // POST adds a suggestion to the list of comments (PUT would overwrite all existing comments of this proposal)
        url: proposal._links.comments.href,
        headers: { 'Content-Type' : 'text/uri-list' },
        data: createdComment._links.self.href
      })
      .catch(err => { return Promise.reject({msg: "LiquidoApiClient: Cannot suggestImprovement", newImprovementText: newImprovementText, err: err}) })
    })
  },



//==================================================================================================================
// Polls
//==================================================================================================================

  /**
   * find polls by their status
   * @param status {string} ELABORATION|VOTING|FINISHED
   * @return List of polls in this status
   */
  findPollsByStatus(status) {
    log.debug("findPollsByStatus()")
    return axios.get('/polls/search/findByStatus?status='+status)
      .then( res => { return res.data._embedded.polls })
      .catch(err => { return Promise.reject({msg: "LiquidoApiClient: Cannot findPollsByStatus()", err:err}) })
  },

  /**
   * Get a poll with all its proposals
   * @param pollSelector a poll or a poll URI
   * @return a poll as JSON
   */
  getPoll(pollIdOrUri) {
    log.debug("getPoll", pollIdOrUri)
    var pollURI
    if (!isNaN(pollIdOrUri)) pollURI = process.env.backendBaseURL+'/polls/'+pollIdOrUri
    else pollURI = this.getURI(pollIdOrUri)
    return axios.get(pollURI)
      .then( res => { return res.data })
      .catch(err => { return Promise.reject({msg: "LiquidoApiClient: Cannot getPoll()", err: err, pollIdOrUri: pollIdOrUri}) })
  },

  joinPoll(proposal, poll) {
    log.debug("joinPoll()", proposal, poll)
    //TODO: make some basic checks about proposal and poll
    var proposalURI = this.getURI(proposal)
    var pollURI = this.getURI(poll)
    return axios({
        method: 'POST',
        url: '/joinPoll',
        headers: { 'Content-Type' : 'application/json' },
        data: {
          proposal: proposalURI,
          poll: pollURI
        }
      })
      .then( res => { return "" })  // returns HTTP status 201
      .catch(err => { return Promise.reject({msg: "LiquidoApiClient: Cannot joinPoll()", err: err}) })
  },


  /**
   * Get user's voter token for the given area
   * @param  areaId Numeric numerical ID of area
   * @return Array list of voter Tokens
   */
  getVoterToken(areaId) {
    log.debug("getVoterToken(area.id="+areaId+")")
    return axios.get("/my/voterToken?area="+areaId)  // spring does require the numerical ID and not the URI in this case
      .then(res => { return res.data.voterToken })
      .catch(err => { return Promise.reject({msg: "LiquidoApiClient: Cannot getVoterToken()", areaId: areaId, err: err}) })
  },

  /**
   * Cast a vote
   * Example POST Payload
   * <pre>
   * {
   *   "poll": "/liquido/v2/polls/253",
   *   "voterTokens": ["$2a$10$1IdrGrRAN2Wp3U7QI.JIzu59hbhW04IPhKE7ius5yICV5KNhFnIee","$2a$10$1IdrGrRAN2Wp3U7QI.JIzuXiumrW37cI87gOLaQA/2kJmEr4MiYxm","$2a$10$1IdrGrRAN2Wp3U7QI.JIzuKgaoXgUrT4Xb4IK7bBxJBSYQltsiehy","$2a$10$1IdrGrRAN2Wp3U7QI.JIzuMm9bsvJm.RaaJgNq0VwXeCVvzuMV4fq"],
   *   "voteOrder": [
   *     "/liquido/v2/laws/246",
   *     "/liquido/v2/laws/261"
   *   ]
   * }
   * </pre>
   */
  castVote(poll, voteOrder, voterToken) {
    log.debug("castVote(poll.id="+poll.id+", voteOrder=", voteOrder)  // do not log secret voterTokens

    return anonymousClient({
      method: 'POST',
      url: '/castVote',
      headers: { 'Content-Type' : 'application/json' },
      data: {
        poll: this.getURI(poll),
        voterToken: voterToken,
        voteOrder: voteOrder
      }
    })
    .then(res => { return res.data })
    .catch(err => {
      console.log("Error in apiClient.castVote", err)
      return Promise.reject({msg: "LiquidoApiClient: Cannot castVote()", poll: poll, err: err})
    })
  },

}

/** By default the cache (for some preconfigured URLs) is enabled */
module.exports.enableCache()