/**
 * HTTP client for sending requests to the backend.
 * I am using (CuJoJs Rest Client)[https://github.com/cujojs/rest] and its interceptors
 * CuJOs REST is a quite powerful REST lib.
 *
 * This module handles all the HTTP specific stuff. It is in no way liquido specific.
 */

var rest = require('rest')
var mime = require('rest/interceptor/mime')
var errorCode = require('rest/interceptor/errorCode')
var pathPrefix = require('rest/interceptor/pathPrefix')
var template = require('rest/interceptor/template')
var basicAuth = require('rest/interceptor/basicAuth')
var uriListConverter = require('./uriListConverter')              // for handling Content-Type: "text/uri-list", used e.g. when adding a supporter to an idea
var cachingInterceptor     = require('./cachingInterceptor')      // cache requests by URL (with TTL)
var logRequestsInterceptor = require('./logRequestsInterceptor')  // very detailed loging of all HTTP requests and responses incl. payload
var loglevel = require('loglevel')

var log = loglevel.getLogger("LiquidoApiClient");
log.debug("Creating httpClient for backend at "+process.env.backendBaseURL)

/* This is a whitelist for requests that will be cached locally in the browser */
var cacheConfig     = { urlFilter: /CACHE_NOTHING/ }

/* Username and password for HTTP BasicAuth. This JS object can be updated later on. */
var basicAuthConfig = { username: null, password: null }

// !!!!! The order of these interceptors is EXTREMELY important !!!!!
// !!!!! The *outer* interceptors at the *bottom* come first. The inner interceptors are executed last.
var httpClient = rest.wrap(mime, { mime: 'application/json'} )   					// convert entity according to mime type
		                 .wrap(cachingInterceptor, cacheConfig)  				 			// caching interceptor must be BEFORE the mime interceptor!
		                 .wrap(errorCode)               											// Promise.reject() responses with http status code >= 400
		                 //.wrap(logRequestsInterceptor, { logPayload: true })  // logs a lot of data. Also try your browsers debug console
                     .wrap(basicAuth, basicAuthConfig)                    // login
										 .wrap(template)																			// support query parameters in the url
		                 .wrap(pathPrefix, { prefix: process.env.backendBaseURL })  // add path prefix to request



module.exports = {
  /**
   * Login a user. Every future request will send these credentials with HTTP BasicAuth
   * @username {string} the username
   * @password {string} the password
   */
  login(username, password) {
    basicAuthConfig.username = username
    basicAuthConfig.password = password
  },

  /**
   * log out the current user
   */
  logout() {
    basicAuthConfig.username = null
    basicAuthConfig.password = null
    //TODO: cachingInterceptor.flush()    // empty the cache
  },

  /**
   * Configure which urls shall be cached. (whitelist)
   * @urlFilter {String or RegEx} urls that match this regex will be cached.
   */
  setCacheUrlFilter(urlFilter) {
  	//log.debug("setting urlFilter in cachingInterceptor to ", urlFilter)
  	if (typeof urlFilter === 'string') {
  		cacheConfig.urlFilter = new RegExp(urlFilter)
  	} else {
  		cacheConfig.urlFilter = urlFilter
  	}
  },

  /**
   * disable cache for next request only
   */
  noCacheForNextRequest() {
    cacheConfig.forceNoCache = true
  },

  /**
   * Set the maximum age for cached data. After this time that request will be refetched from the backend.
   * @param ttl {integer} time to live in seconds
   */
  setCacheTTL(ttl) {
  	cacheConfig.ttl = ttl
  },

  getClient() {
    return httpClient
  },

}