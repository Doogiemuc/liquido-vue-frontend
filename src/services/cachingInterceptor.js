/**
 * CuCoJS REST Client interceptor that caches responses for GET requests.
 * Only HTTP GET requests will be cached!
 * 
 * Configuration
 * - urlFilter: regex for url that shall be cached, by default "http.*" will cache everything
 * - ttl: max time to live for elements in the cache. After that time elements will be refreshed. Default: 60 seconds
 */

import loglevel from 'loglevel'
var log = loglevel.getLogger("cachingInterceptor");
var interceptor = require('rest/interceptor');

/** the cache is an Object. So you can practically store up to 1 million responses in here. */
var cache = {}

export function getCache() {
  return cache
}

/** clear the cache completely */
export function flush() {
  cache = {}
}

/** remove all elements from the cache that are expired */
export function purgeExpired() {
  Object.keys(cache).forEach(key => {
    if (isExpired(key)) delete cache[key]
  })
}

/** Forcefully remove all cache elements that match a given pattern. No matter if they are expired or not. */
export function deleteByPattern(keyPattern) {
  Object.keys(cache).forEach(key => {
    if (keyPattern.test(key)) delete cache[key]
  })
}

/** @return true if a cache elem is expired */
export function isExpired(key) {
  if (!cache.hasOwnProperty(key)) return false
  return Date.now() - cache[key].timestamp > config.ttl*1000
}

/** get one element from the cache. Used for testing */
export function getFromCache(key) {
  return cache[key]
}



/** ES6 module default export creates interceptor via cujos factory */
export default interceptor({
  /**
   * setup the cache 
   */
  init: function (config) {
    config.urlFilter      = config.urlFilter  || /http.*/
    config.ttl            = config.ttl || 60   // in seconds!
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
    if (request.entity) return request   // Do not cache PUT, POST or PATCH requests. (request.method is empty in this phase !)
    if (!config.urlFilter.test(request.path)) return request
    var key = request.path
    var cachedElem = cache[key]
    if (!cachedElem) return request       // If not found in cache, send normal request.
    if (!isExpired(key)) {
      cachedElem.response.fromLocalCache = true
      log.info("=> "+ key, "from CACHE", cachedElem.response)
      //request.response = cachedElem.response
      //return request
      return new interceptor.ComplexRequest({ response: cachedElem.response });
    } else {
      log.debug("Cached key "+key+" is expired. Will refetch.")
      delete cache[key]
    }
    return request;
  },

  /**
   * If this is a successfull response to a GET request, 
   * then cache the returned response (incl. its entity if any) in the cache with a timestamp.
   */
  success: function (response, config, meta) {
    //TODO: check HTTP 1.0 Pragma:"no-cache" or HTTP 1.1 Cache-Control headers if we are allowed to cache.
    if (response.request.method !== 'GET') return response
    if (response.fromLocalCache) return response   // do not cache already cached responses. Do not update timestamp.  (success is actually not called when request returns a ComplexRequest. Which is also fine.)
    var auth    = response.request.headers.Authorization
    var key     = response.request.path   //TODO: Should auth be appended to the key?
    var entity  = response.entity
    cache[key] = {
      timestamp: Date.now(),
      response:  response
    }
    log.info("cached response for GET ", key);
    return response;
  }
  
})
  
