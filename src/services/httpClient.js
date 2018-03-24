/** 
 * HTTP client for sending requests to the backend.
 * I am using (CuJoJs Rest Client)[https://github.com/cujojs/rest] and its interceptors
 * CuJOs REST is a quite powerful REST lib. 
 */

import rest from 'rest'  
import mime from 'rest/interceptor/mime'
import errorCode from 'rest/interceptor/errorCode'
import pathPrefix from 'rest/interceptor/pathPrefix'
import basicAuth from 'rest/interceptor/basicAuth'
//import uriListConverter from './uriListConverter'               // for handling Content-Type: "text/uri-list"
import cachingInterceptor     from './cachingInterceptor'       // cache requests by URL (with TTL)
import logRequestsInterceptor from './logRequestsInterceptor'   // very detailed loging of all HTTP requests and responses incl. payload
import loglevel from 'loglevel'

var log = loglevel.getLogger("LiquidoApiClient");
log.debug("Creating httpClient for backend at "+process.env.backendBaseURL)

/* This is a whitelist for requests that will be cached locally in the browser */
var cacheConfig = { urlFilter: /CACHE_NOTHING/ }

// !!!!! The order of these interceptors is EXTREMELY important !!!!!
// !!!!! The *outer* interceptors at the *bottom* come first. The inner interceptors are executed last.
var httpClient = rest.wrap(mime, { mime: 'application/json'} )   					// then convert entity according to mime type
		                 .wrap(cachingInterceptor, cacheConfig)  				 			// caching interceptor must be BEFORE the mime interceptor!
		                 .wrap(errorCode)               											// Promise.reject() responses with http status code >= 400 
		                 .wrap(logRequestsInterceptor, { logPayload: true })  // first of all log the request
		                 .wrap(pathPrefix, { prefix: process.env.backendBaseURL })  // add path prefix to request



export default {
  /** 
   * Login a user. Every future request will send these credentials with HTTP BasicAuth
   * @username {string} the username
   * @password {string} the password
   * @return a REST client that will send this basicAuth information on each request. (A CuJo REST client wraped with a CuJo basicAuth interceptor.)
   */
  basicAuth(username, password) {
    httpClient = httpClient.wrap(basicAuth, { username: username, password: password });
    return httpClient
  },
 
  /**
   * Configure which urls shall be cached. (whitelist)
   * @urlFilter {String or RegEx} urls that match this regex will be cached.
   */
  setCacheUrlFilter(urlFilter) {
  	log.debug("setting urlFilter in cachingInterceptor to ", urlFilter)
  	if (typeof urlFilter === 'string') {
  		cacheConfig.urlFilter = new RegExp(urlFilter)
  	} else {
  		cacheConfig.urlFilter = urlFilter
  	}
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