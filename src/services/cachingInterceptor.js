/**
 * CuCoJS REST Client interceptor that caches responses for GET requests.
 * Only HTTP GET requests will be cached!
 * 
 * Configuration
 * - urlFilter: regex for url that shall be cached, by default cache every http or https GET request.
 * - ttl: max time to live for elements in the cache. After that time elements will be refreshed. Default: 60 seconds
 * - forceNoCache: do not use the cache for the next request.
 */

import loglevel from 'loglevel'
var log = loglevel.getLogger("cachingInterceptor");
var interceptor = require('rest/interceptor');

/** 
 * The cache is an Object. So you can practically store up to 1 million responses by url in here. 
 * Each element in the cache will have the request.path as its key and a timestampe and the full response as its value:
   cache = {
     'http://some.url?search=something' : {
       timestamp: 1453255,  // unix time when this response was received (see TTL)
       request: <full HTTP request object as returned by the server>
     },
     ...
   }
 */
var cache = {}

var getCache = function() {
  return cache
}

/** clear the cache completely */
function flush() {
  cache = {}
}

/** remove all elements from the cache that are expired */
var purgeExpired = function() {
  Object.keys(cache).forEach(key => {
    if (isExpired(key)) delete cache[key]
  })
}

/** Forcefully remove all cache elements that match a given pattern. No matter if they are expired or not. */
var deleteByPattern = function(keyPattern) {
  Object.keys(cache).forEach(key => {
    if (keyPattern.test(key)) delete cache[key]
  })
}

/** @return true if a cache elem is expired */
var isExpired = function(key, config) {
  if (!cache.hasOwnProperty(key)) return true
  return Date.now() - cache[key].timestamp > config.ttl*1000
}


/** get one element from the cache. Used for testing */
var getFromCache = function(key) {
  return cache[key]
}

/** ES6 module default export creates interceptor via cujos factory */
export default interceptor({
  /**
   * setup the cache 
   */
  init: function (config) {
    config.urlFilter      = config.urlFilter  || /http.*/   // by default cache every http request
    config.ttl            = config.ttl || 5   // in seconds!
    config.forceNoCache   = false             // force no cache *for the next request* only
    cache                 = {}
    return config;
  },

  /**
   * If this is a GET request (without an entity) and its URL matches the urlFilter
   * then check if there is a cached response
   *   If there is one, then return this cached response as a ComplexRequest. No request to the server will be sent.
   *   otherwise send a normal request
   */
  request: function (request, config, meta) {
    //log.debug("========== checking for cache", config.urlFilter)
    if (request.entity) return request   // Do not cache PUT, POST or PATCH requests. (request.method is empty in this phase !)
    if (config.forceNoCache) {
      config.forceNoCache = false
      return request
    }
    if (!config.urlFilter.test(request.path)) return request   // Do not cache if urlFilter does not match
    var key = request.path
    var cachedElem = cache[key]
    if (!cachedElem) return request       // If not found in cache, send normal request.
    if (!isExpired(key, config)) {
      cachedElem.response.fromLocalCache = true     // add an attribute that response came from local cache
      var ageSecs = (Date.now() - cache[key].timestamp) / 1000
      log.info("=> "+ key, "returning "+ageSecs+" secs old data from CACHE:", cachedElem.response) 
      return new interceptor.ComplexRequest({ response: cachedElem.response });   // return response from cache
    } else {
      log.debug("Cached key "+key+" is expired. Will refetch.")
      delete cache[key]
    }
    return request;
  },

  /**
   * If this is a successfull response to a GET request, 
   * then cache the returned response (incl. its response.entity if any) in the cache with a timestamp.
   */
  success: function (response, config, meta) {
    if (response.request.method !== 'GET') return response
    if (response.fromLocalCache) return response   // do not cache already cached responses. Do not update timestamp.  (success is actually not called when request returns a ComplexRequest. Which is also fine.)
    // When HTTP 1.1 response header Cache-Control contains 'no-cache'. Then do not cache the response
    if (response.headers['Cache-Control'] && response.headers['Cache-Control'].indexOf('no-cache') >= 0) { return response }
    var auth    = response.request.headers.Authorization
    var key     = response.request.path   //TODO: Should auth be appended to the key?
    cache[key] = {
      timestamp: Date.now(),
      response:  response
    }
    //log.debug("added response for GET", key, "into cache");
    return response;
  },

  
  
})
  
