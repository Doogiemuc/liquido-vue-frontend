/**
 * Simple cache that can store key = value pairs
 *
 * This module is meant to be used as a singleton!
 *
 * Planned feature: Let keys automatically expire
 */

import _ from 'lodash'
import loglevel from 'loglevel'
var log = loglevel.getLogger("SessionCache");


// Private cache
var cache = {}

// Public methods
module.exports = {
  /**
   * Put an item into the cache.
   * Will overwrite any previous value
   */
  put: function(key, value) {
    cache[key] = value
  },

  /** 
   * Get an item from the cache, if it is in there. 
   * Will return a cloned value!
   * MAY return null if null is stored under that key. (Yeah, that's JS.)
   */
  get: function(key) {
    return _.clone(cache[key])
  },

  /**
   * deletes the given key and its value from the cache.
   * (Keep in mind that in javascript a value inside the cache may also be only undefined.)
   */
  deleteKey: function(key) {
    delete cache[key]
  },

  /**
   * Get an item from the cache directly if it is in there or use loadFunc to fetch it and then save it.
   * @param key the cache key
   * @param loadFunc a function that loads the value e.g. from a remote resource and returns a Promise
   * @param loadFuncParams (optional) parameteres for the loadFunc
   * @return (A Promise that will resolve to) the loaded value. Will resolve immideately when item was already in the cache.
   */
  load: function(key, loadFunc, ...loadFuncParams) {
    var logId = '[' + new Date().getTime() % 10000 + ']';
    log.debug("=> " + logId + " SessionCache.load(key='"+key+"', loadFuncParams=", loadFuncParams, ")")
    if (this.has(key)) {
      log.debug("<= " + logId + " SessionCache.load(key='"+key+"', loadFuncParams=", loadFuncParams, "): found in CACHE")
      return Promise.resolve(this.get(key))
    } else {
      return loadFunc.apply(this, loadFuncParams)
        .then(result => {
          log.debug("<= " + logId + " SessionCache.load(key='"+key+"', loadFuncParams="+loadFuncParams+"): loadFunc returned: ", result)
          cache[key] = result
          return Promise.resolve(result)
        })
        .catch(err => {
          log.error("ERROR in SessionCache: Cannot load key='"+key+"' with loadFunc:", err)
          return Promise.reject("ERROR in SessionCache: Cannot load key='"+key+" "+err)
        })
    }
  },

  /** @return true if that key exists in the cache and has a defined value not equal to null */
  has: function(key) {
    return cache[key] != undefined && cache[key] != null
  },

  /** empty the cache */
  flush: function() {
    this.cache = {}
  },

  /** @return the numver of unique keys in the cache */
  size: function() {
    return Object.keys(cache).length
  }

}