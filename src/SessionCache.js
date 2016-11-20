/**
 * Global session cache that can store key = value pairs
 *
 * This class is a singleton!
 *
 * Planned: Let keys automatically expire
 */

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

  /** get an item from the cache, if it is in there. MAY return undefined */
  get: function(key) {
    //MAYBE:return cloned value?  But why?   This way the value inside the cache could be changed.
    return cache[key]
  },

  /**
   * get an item from the cache or use loadFunc to fetch it
   * @param key the cache key
   * @param loadFunc a function that loads the value e.g. from a remote resource and returns a Promise
   * @return (A Promise that will resolve to) the loaded value. Will resolve immideately when item was already in the cache.
   */
  load: function(key, loadFunc) {
    if (this.has(key)) {
      console.debug("Found key='"+key+"' in cache with value="+cache[key])
      return Promise.resolve(this.get(key))
    } else {
      console.debug("Loading key='"+key+"' with loadFunc: ", loadFunc)
      return loadFunc().then(result => {
        console.debug("... got result=", result)
        cache[key] = result
        return result
      })
    }
  },

  /** @return true if that key exists in the cache and has a defined value not equal to null */
  has: function(key) {
    return cache[key] != undefined && cache[key] != null
  },

  /** @return the numver of unique keys in the cache */
  size: function() {
    return Object.keys(cache).length
  }

}