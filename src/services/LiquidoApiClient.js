/**
 * API client  for the Liquido backend. This class is the central facade for all API methods.
 * Every call to the backend comes through here.
 *
 * All API functions return a Promise. When the HTTP operation fails, then this promise will reject
 * with an error message.
 *
 * I know this module is too large for one file. I started to split it up several times. But in the end
 * I personally had the best coding experience when everything was in one file.
 * I tried many different node REST client libraries. But axios was the best and most simple to use.
 */

var _ = require('lodash')
//var qs = require('qs');  // A querystring parsing and stringifying library with some added security.
var template = require('url-template');   // parsing and expanding RFC 6570 URI Templates
var loglevel = require('loglevel')
var log = loglevel.getLogger("LiquidoApiClient")

//==================================================================================================================
// AXIOS http client
//==================================================================================================================

const axios = require('axios')              // main HTTP client
const anonymousClient = axios.create()      // extra HTTP client instance for anonymous unauthenticated requests

/***** Set Base URL of backend *****/
if (process.env.backendBaseURL) {
  axios.defaults.baseURL = process.env.backendBaseURL
  anonymousClient.defaults.baseURL = process.env.backendBaseURL
} else
if (window.Cypress) {   // when running under Cypress TEST
  console.log("Running apiClient under Cypress TEST")
  axios.defaults.baseURL = window.Cypress.config('backendBaseURL')
  anonymousClient.defaults.baseURL = window.Cypress.config('backendBaseURL')
  log = console     //BUGFIX to show loglevel output in Cypress test runner's console
} else {
  throw new Error("LiqudioApiClient: baseURL MUST be defined!")
}
log.debug("LiqudioApiClient (instanceId="+Math.random() + ") pointing to baseUrl=" + axios.defaults.baseURL)

/***** Axios RESPONSE interceptor: global error handler ******/
axios.interceptors.response.use(function (response) {
	return response
}, function (error) {
  	if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
		if (error.response.status >= 500) {
			if (error.response.data && error.response.data.message) {
				log.error("Error response: "+error.response.data.message, error.response)
			} else {
				log.error("Error response", error.response)
			}
		//TODO: if (response.data.liquidoErrorName === "JWT_TOKEN_EXPIRED") { ... }
		} else {
			
			log.warn("Http Error Response 4xx: ", error.response)
		}
  	} else if (error.request) {
		// The request was made but no response was received
		// `error.request` is an instance of XMLHttpRequest in the browser and an instance of
		// http.ClientRequest in node.js
		log.error("Error in request", error.request);
  	} else {
		// Something happened in setting up the request that triggered an Error
		log.error('Other error', error.message);
	}
	//console.log("Error.config", error.config);
	return Promise.reject(error);
})


//==================================================================================================================
// Module private fields and methods
//==================================================================================================================


// local cache of globalProperties
// They would also be cached by our cachingInterceptor, but we want a longer TTL
var globalPropertiesCache = undefined


//TODO: do i need client side caching at all? => well it is for example nice for client side filtering. => Cache in table?
// I once had a nice caching interceptor. But do I globally need that?



//==================================================================================================================
// Public/Exported methods
//==================================================================================================================

module.exports = {
  currentUser: undefined,			// just a cache for currentUser in auth.js
  jsonWebToken: undefined,

  /** Set the JWT that will be used for all future requests */
  setJsonWebTokenHeader(jwt) {
    if (!jwt) {
	  axios.defaults.headers.common['Authorization'] = undefined
	  this.jsonWebToken = undefined
    } else {
	  axios.defaults.headers.common['Authorization'] = "Bearer "+jwt
	  this.jsonWebToken = jwt
      //log.debug("apiClient authorized with JWT")
    }
  },

  setCurrentUser(user) {
	  this.currentUser = user
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


//==================================================================================================================
// HATEOAS
//==================================================================================================================

  /**
   * The ID of a domain object in our REST HATEOAS context is the full REST URI of this REST resource,
   * e.g. <pre>http://localhost:8080/liquido/v2/areas/42</pre>
   * @param {String|Object} model If you already pass a valid URI as a string, then that URI will be returned as is.
   *        Otherwise you can also pass a model that you loaded before. Then its _links.self.href will be returned.
   * @return {URI} an URI that points to a resource on our REST backend
   */
  getURI(model) {
    var uriRegEx = new RegExp('^'+axios.defaults.baseURL+'[\\w/]*/\\d+$')
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

  /**
   * In HATEOAS every JSON entity has some _links that you can follow.
   * There is always a self link that points to the REST resource itself:  _links.self.href
   * @param HATEOAS {JSON} JSON as returned by the spring-data-rest server
   * @param linkName {String} the name of the link that we want to follow, e.g. "self" or "childObject"
   * @param urlTemplateParams {Object} optional RFC6570 URI template parameters for url template expansion, e.g. {?projection}
   * @return the links's parsed URL
   */
  getHateoasLink(hateoasJson, linkName, urlTemplateParams) {
    if (hateoasJson === undefined || hateoasJson._links === undefined)
      throw new Error("Need HATEOAS JSON with _links")
    if (linkName === undefined)
      throw new Error("Need HATEOAS name of link")
    urlTemplateParams = urlTemplateParams || {}
    var link = hateoasJson._links[linkName]
    if (link === undefined) throw new Error("Cannot find HATEOAS link with name "+linkName)
    var urlTemplate = template.parse(link.href)
    var url = urlTemplate.expand(urlTemplateParams)
    return url
  },

  /**
   * Follow an HATEOAS link and return the linked entity
   * @param hateoasJson {Object} a entity as returned by the backend (with _links, _self etc.)
   * @param linkName {String} name of HATEOAS _link to follow
   * @param urlTemplateParams {Object} (optional) parameteres in the _link's URL that will be expanded (e.g. project=myProjection)
   * @return (a promise that will resolve to) the linked entity or an array of entities
   */
  follow(hateoasJson, linkName, urlTemplateParams) {
    var url = this.getHateoasLink(hateoasJson, linkName, urlTemplateParams)
    return axios.get(url).then(res => res.data)       // might return just one entity or an array of entities
  },

  /**
   * get the internal ID from a URI that points to an entity resource in the backend
   * Yes I know this is a crude hack. But necessary, when such an ID is needed as a PathParameter for the next request
   */
  getIdFromUri(modelUri) {
    var uriRegEx = new RegExp("(\\d+)$")  // javascript default is greedy match, so this will match the number at the end of modelUri
    var match = modelUri.match(uriRegEx)
    if (!match || !match[1]) throw new Error("Cannot getIdFromUri: "+modelUri)
    return match[1]
  },

//==================================================================================================================
// Users
//==================================================================================================================

  /** Fetch all users (paged) */
  getAllUsers() {
    return axios.get('/users').then(
      res => { return res.data._embedded.users }
    )
  },

  /** Find user by email */
  findUserByEmail(email) {
    return axios.get('/users/search/findByEmail?email='+email)
     .then(res => {
      return res.data
    })
    .catch(err => {
      return Promise.reject({msg: "Cannot findUserByEmail", email: email, err: err})
    })
  },

  /** Update existing user */
  saveUser(user) {
	log.info("Save user "+user.email)
	return axios({
		method: 'PUT',   // PUT is idempotent. POST is not.   Go learn REST :-)  Just kidding. Also took me a year to grasp the difference :-)
		url: this.getURI(user),
		headers: { 'Content-Type' : 'application/json' },
		data: user
	})
	.catch(err => {
		return Promise.reject({msg: "Cannot save user ", email: user.email, err: err})
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
    //log.debug("Loading global properties from backend (and caching them)")
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
// Categories (called Areas in the backend)
//==================================================================================================================

  /** lazy load all categories */
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
      return Promise.reject("Cannot get Category from uri="+uri)
    }
  },

//==================================================================================================================
// User data and Proxies
//==================================================================================================================

  /** fetch HATEOAS details of currently logged in user */
  getMyUser() {
    return axios.get('/my/user', { headers: { 'Content-Type' : 'application/json' }}).then(res => res.data)
  },

  /** get the checksum of a public proxy */
  getPublicChecksum(area, proxy) {
    console.log("getPublicChecksum", area, proxy)
    if (!area) return Promise.reject("Need area to getPublicChecksum()")
    if (!proxy) return Promise.reject("Need proxy to getPublicChecksum()")
    return axios.get('/users/'+proxy.id+'/publicChecksum', { params: {
      area: area.id,
    }})
    .then(res => res.data )
    .catch(err => {
      if (err.response.status == 404) {
        log.debug("Voter is not a public proxy, ie. has no public checksum.")
        return Promise.resolve(undefined)
      } else {
        return Promise.reject(err)
      }
    })
  },

  /** fetch all information about a voter's proxy in one area */
  getMyProxy(area) {
    return axios.get('/my/proxy/'+area.id).then(res => res.data)
  },

  /** add or update a delegation from the currently logged in user to a proxy */
  assignProxy(category, proxy, voterToken, transitive) {
    if (!category) return Promise.reject("Missing category for saveProxy()")
    if (!proxy) return Promise.reject("Missing proxy for saveProxy()")
    var proxyURI = this.getURI(proxy)
    log.debug("assignProxy(category.id="+category.id+", proxy="+proxyURI+", transitive="+transitive+")")
    return axios.put('/my/proxy/'+category.id, {
        toProxy:    proxyURI,
        voterToken: voterToken,
        transitive: transitive
      }).then(res => res.data)
  },

  /** remove the proxy of the currently logged in user in the given category */
  removeProxy(category, voterToken) {
    if (!category) return Promise.reject("Missing category for removeProxy()")
    var categoryURI = this.getURI(category)
    log.debug("removeProxy(category="+categoryURI+")")
    return axios.delete('/my/proxy/'+category.id, { params : {
      voterToken: voterToken
    }})
  },

  /** get accepted delegations, pending delegation requests and the recursive delegation count for this proxy */
  getMyDelegations(area, voterToken) {
    return axios.get("/my/delegations/"+area.id, { params: { voterToken: voterToken }}).then(res => res.data)
  },

  acceptDelegationRequests(area, voterToken) {
    return axios.put("/my/delegations/"+area.id+"/accept", { voterToken: voterToken }).then(res => res.data)
  },

  becomePublicProxy(area, voterToken) {
    return axios.put("/my/delegations/"+area.id+"/becomePublicProxy", { voterToken: voterToken }).then(res => res.data)
  },


//==================================================================================================================
// Ideas
//==================================================================================================================

  /**
	 * reload one proposal from server
	 * @param {string|object} lawIdOrURI ID or URI of an idea, proposal or law
	 * @param {boolean} projected wether to return the projected ("extended") JSON with area and createdBy expanded.
	 * @return {object} the reloaded idea as HATEOAS JSON
	 */
  getLaw(lawIdOrURI, projected) {
	var lawURI
	if (lawIdOrURI === undefined) throw new Error("Need lawId or an URI to get an idea/proposal/Law!")
    if (!isNaN(lawIdOrURI)) lawURI = axios.defaults.baseURL+'/laws/'+lawIdOrURI
    else lawURI = this.getURI(lawIdOrURI)
    if (projected) lawURI += "?projection=lawProjection"
		log.debug("getLaw()", lawURI)
    return axios.get(lawURI).then(res => res.data)
  },

  getIdea(ideaIdOrURI, projected) {
    return this.getLaw(ideaIdOrURI, projected)
  },

  /**
   * find ideas, proposals or laws by search criteria
   * @return the full page object, with the actual result list under _embedded.laws
   *         and additional paging information under the top level "page" attribute
   */
  findByQuery(query) {
    log.debug("findByQuery()", query)
    return axios({
      method: 'POST',
      url: '/laws/search/findByQuery',
      headers: { 'Content-Type' : 'application/json' },
      data: query
    })
    .then(res => { return res.data })
    .catch(err => { return Promise.reject("LiquidoApiClient: Cannot findByQuery()", err) })
  },

  /**
   * Lookup ideas, propsals or laws. (status of a LawModle)
   * Result is paged. By default the first 20 entries are returned.
   * @param {string} status IDEA|PROPOSAL|LAW
	 * @param {number} page number of page to load
	 * @param {size}   size length of one page
	 * @param {string} sort <name of attribute>[,asc|desc]
   * @return paged list of ideas, proposals or laws. The list contains projected LawModels (with detail information already included).
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
   * @return the stored idea or 409 if an idea with that title already exists
   */
  saveNewIdea(newIdea) {
    log.debug("POST newIdea: "+JSON.stringify(newIdea))
    return axios({
      method: 'POST',
      url: '/laws',
      headers: { 'Content-Type' : 'application/json' },
      data: newIdea
    }).then(res => {
      return res.data
    }).catch(err => {
      if (err.response.status == 409) {
        log.warn("Cannot saveNewIdea: An idea with that exact title already exists! "+JSON.stringify(newIdea)+" :", err)
      } else {
        log.error("Cannot saveNewIdea:"+JSON.stringify(newIdea)+" :", err)
      }
      return Promise.reject(err)
    })
  },

  /**
   * Update some fields of an existing(!) idea, proposal or law. Keep in mind that title must be unique.
   * @param {URI} uri the absolute REST path to the resource on the server.
   * @param {JSON} update the fields that shall be updated. Does not need to contain all fields of an idea.
   * @return the response sent from the server which is normally the complete updated resource with all its fields.
   */
  patchIdea(uri, update) {
    log.debug("PATCH "+uri+" "+JSON.stringify(update))
    if (!uri.startsWith('http')) return Promise.reject("ERROR in patchIdea: URI must start with http(s)! wrong_uri="+uri)
    if (!update) return Promise.reject("patchIdea called with empty update")
    return axios({
      method: 'PATCH',
      url: uri,                                             // Wanna discuss the difference between url and uri :-)
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
   * add current user as a supporter to an idea
   * @param {Object} idea the idea that the user likes
   * @param {Object} user the user that likes to discuss this idea
   * @return Just HTTP status 204
   */
  addSupporterToIdea(idea) {
    if (!idea) return Promise.reject("Cannot add Supporter. Need idea!")
    return axios({
      method:  'POST',
      url:     '/laws/'+idea.id+'/like',
    }).then(res => {
	  log.info("Current user " + (this.currentUser ? this.currentUser.email : "!ERROR!") +  " now supports idea("+idea.id+") '"+idea.title)
      return ""  // backend returns status 204
    }).catch(err => {
      log.error("Cannot addSupporter to idea(id="+idea.id+")", err)
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
				log.error("cannot getRecentIdeas: ", JSON.stringify(err))
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

  reachedQuorumSinceAndCreatedBy(since, createdByURI) {
    log.debug("reachedQuorumSinceAndCreatedBy(since="+since+", createdByURI="+createdByURI+")")
    return axios.get('/laws/search/reachedQuorumSinceAndCreatedBy?since='+since+'&createdBy='+createdByURI)
      .then(res => { return res.data._embedded.laws })
      .catch(err => {
        log.error("ERROR in apiClient: ", JSON.stringify(err))
        return Promise.reject("LiquidoApiClient: Cannot reachedQuorumSinceAndCreatedBy(since="+since+", createdByURI="+createdByURI+")")
      })
  },

  /** get proposals with recent comments. Only proposals can be discussed */
  getRecentlyDiscussed() {
    return axios.get('/laws/search/recentlyDiscussed').then(res => res.data._embedded.laws)
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
    //TODO: use currentUser. But api client does not know user. It only knows JWT ???
    var upvotersURI = comment._links.upVoters.href   // e.g. /comments/4711/upVoters
    var userURI     = this.getURI(user)
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
   * @param newCommentText {String} text of new comment
   * @param law {Object} the proposal
   * @param parent {Object} parent comment if this is a reply
   */
  saveComment(newCommentText, proposal, parent) {
    var newComment = {
      comment: newCommentText,
      proposal: this.getURI(proposal)
    }
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
    return this.saveComment(newImprovementText, proposal, null)  // no parent for new root comment
    .then(res => {
      var createdComment = res.data
      var proposalCommentsUrl = this.getHateoasLink(proposal, "comments")  // Need url without {?projection}
      return axios({
        method: 'POST',   // POST adds a suggestion to the list of comments (PUT would overwrite all existing comments of this proposal)
        url: proposalCommentsUrl,
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

  findPollsByStatusAndArea(status, areaURI) {
	log.debug("findPollsByStatusAndArea()")
    return axios.get('/polls/search/findByStatusAndArea?status='+status+'&area='+areaURI)
      .then( res => { return res.data._embedded.polls })
      .catch(err => { return Promise.reject({msg: "LiquidoApiClient: Cannot findPollsByStatusAndArea", err:err}) })
  },

  /**
   * Load a poll with all its proposals from the backend.
   * @param pollSelector {Number|URI} a poll ID or a poll URI
   * @return the poll as JSON
   */
  getPoll(pollIdOrUri) {
    log.debug("getPoll", pollIdOrUri)
    var pollURI
    if (!isNaN(pollIdOrUri)) pollURI = axios.defaults.baseURL+'/polls/'+pollIdOrUri
    else pollURI = this.getURI(pollIdOrUri)
    return axios.get(pollURI)
      .then( res => { return res.data })
      .catch(err => { return Promise.reject({msg: "LiquidoApiClient: Cannot getPoll()", err: err, pollIdOrUri: pollIdOrUri}) })
  },

  /** Create a new poll from one proposal */
  createNewPoll(poll) {
    log.debug("POST createNewPoll: "+JSON.stringify(poll))
    return axios({
      method: 'POST',
      url: '/polls/add',
      headers: { 'Content-Type' : 'application/json' },
      data: poll
	})
	.then(res => { return res.data })
	.catch(err => {
    	if (err.response.status == 409) {
        	log.warn("Cannot createNewPoll: A poll with that exact title already exists! "+JSON.stringify(poll)+" :", err)
    	} else {
        	log.error("Cannot createNewPoll:"+JSON.stringify(poll)+" :", err)
    	}
    	return Promise.reject(err)
    })
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
   * @param areaId {Number} Numeric numerical ID of area
   * @param {String} tokenSecret users private tokenSecret from which his token will be created.
   * @return users voterToken
   */
  getVoterToken(area, tokenSecret, becomePublicProxy) {
    log.debug("getVoterToken(area.id="+area.id+")")
    return axios.get("/my/voterToken/"+area.id, { params: {
        tokenSecret: tokenSecret,
        becomePublicProxy: becomePublicProxy
      } })
      .then(res => res.data )
      // This is too important, therefore we have a dedicated catch clause here. In addition to the global one
      .catch(err => {
        log.error("LiquidoApiClient: Cannot getVoterToken for areaId="+areaId, err)
        return Promise.reject({msg: "LiquidoApiClient: Cannot getVoterToken()", areaId: areaId, err: err})
      })
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
    /*
    .catch(err => {
      console.log("Error in apiClient.castVote", err)
      return Promise.reject({msg: "LiquidoApiClient: Cannot castVote()", poll: poll, err: err})
    })
    */
  },

    /** get voter's own ballot in that poll, if he has already voted */
  getOwnBallot(poll, voterToken) {
    log.debug("getOwnBallot(pollId="+poll.id+" with voterToken)")
    if (!poll) return Promise.reject("Need poll to getOwnBallot!")
    return axios.get('/polls/'+poll.id+'/ballot/my', { params : {
      voterToken: voterToken
    }})
    .then(res => { return res.data })
  },

  /**
   * Verify if a ballot with that checksum was counted in the poll
   * @param {Number} pollId id of a poll
   * @param {String} checksumStr a checksum to verify
   * @return true, if a ballot with that checksum exists in this poll
   */
  verifyChecksum(pollId, checksum) {
	  return axios.get('/polls/'+pollId+'/verifyChecksum', { params: {
		  checksum: checksum
	  }})
	  .then(res => { return res.data })
  }

}
