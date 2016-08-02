/**
 * This is a base class for a RESTful Client.
 * It is responsible for
 * - CRUD operations
 * - Lazy loading data
 * - Caching
 * - and error handling
 * It is a Javascript abstraction for the interface to the DB.
 */
var _ = require('lodash'),
    Client = require('node-rest-client').Client,
    client = new Client()

client.on('error', function(err) {
  console.error('ERROR in node-rest-client', err)
})


module.exports = class BaseRestClient {
  /**
   * Create a new instance of a RestClient
   * @param url may contain path variables in the form ${var}
   * @param urlParams URL query parameters that will be sent with <b>every</b> request. This can for example be used for apiKeys
   */
  constructor(url, urlParams, nameOfIdAttr) {
    this.url          = url
    this.urlParams    = urlParams
    this.nameOfIdAttr = nameOfIdAttr || 'id'  // mongoDB has  '_id.$oid'
    this.cache  = {}
  }
  
  /** 
   * Retreive the ID of a given item.
   * This ID is used for the cache.
   * You must overwrite this if your id attribute is not called "id".
   */
  getId(item) {
    if (item === undefined) throw new Error("BaseRestClient: Cannot get Id of undefined!")
    return _.get(item, this.nameOfIdAttr)
  }
  
  /** put one item (or all items in an array) into the cache */
  cachePut(itemOrItems) {
    if (_.isArray(itemOrItems)) {
      itemOrItems.forEach((item) => {
        this.cache[this.getId(item)] = item    
      })
    } else {
      this.cache[this.getId(itemOrItems)] = itemOrItems
    }
  }
  
  /** 
   * Get an item from the cache by its ID. 
   * This Might return undefined if item is not in the cache! Use getById() if you need to query for an item
   */
  cacheGet(id) {
    return this.cache[id]
  }
  
  /** Get all items from the server. Without using the cache! */
  getAll(params) {
    var that = this
    var args = {
      parameters: _.merge(params, this.urlParams),
      path: { id: '' }   
    }
    return new Promise(function(resolve, reject) {
      console.log("getAll() => "+that.url, args)
      client.get(that.url, args, function(data, response) {
        console.log("getAll() <= Array("+data.length+")")
        that.cachePut(data)
        resolve(data)
      }).on('error', function (err) {
        reject('ERROR in BaseRestClient.getAll():', err)
      })
    })
  }
  
  /** 
   * Get one item by its unique ID.
   * By default the item will be returned from the cache.
   * @param id the primary key of the item to fetch
   * œparam  params (optional) additional URL query parameteres
   * @param nocache (optional) if true, then the value will fetched and updated from the server
   * @return a Promise that will resolve with the fetched item
   */
  getById(id, params, nocache) {
    
    if (!nocache && this.cacheGet(id) !== undefined) {
      return Promise.resolve(this.cacheGet(id))
    }
    var that = this
    var args = {
      parameters: _.merge(params, this.urlParams),
      path: { id: id }
    }
    return new Promise(function(resolve, reject) {
      console.log("getById(id="+id+") => "+that.url, args)
      client.get(that.url, args, function(item, response) {
        console.log("getById(id="+id+") <= ", item)
        that.cachePut(item)  // remember item in cache
        resolve(item)
      }).on('error', function (err) {
        reject('ERROR in BaseRestClient.getById(id='+id+'):', err)
      })
    })
  }
  
  /** 
   * Find mulitple documents by their repective ID 
   * This method is highly optimized:
   *  1. Remove duplicates from `ids` array 
   *  2. Try to find items in the cache
   *  3. Only query for the remaining items by id
   *  4. Put the received new items in the cache for later.
   *  4. return merged results from cache and DB
   * 
   * @param ids array of IDs
   * @param params additional url query parameters
   * @param nocache if true, then will not lookup items from cache
   * @return array of found items
   * 
   */
  getByIds(ids, params, nocache) {
    //console.log("getByIds", ids, params)
    if (!_.isArray(ids)) throw new Error("Param for getByIds must be Array.")
    var that = this
    var result = []
    var notInCacheIds = []
    ids = _.uniq(ids)
    //----- get items from cache, where possible
    ids.forEach((id) => {
      if (!nocache && this.cache[id] !== undefined) {
        result.push(this.cache[id])
      } else {
        notInCacheIds.push('{$oid:"'+id+'"}')  // see http://stackoverflow.com/questions/26938598/mongodb-oid-vs-objectid
      }
    })
    if (notInCacheIds.length == 0) {
      return Promise.resolve(result)  // Found all in cache    
    }
    //----- query DB for the rest of the ids that were not found in the cache
    var query = '{'+this.nameOfIdAttr+' : { $in: ['+notInCacheIds.join(',')+'] } }'
    return new Promise(function(resolve, reject) {
      that.findByQuery(query, params).then((dbResult) => {
        resolve(result.concat(dbResult))
      })
    })
  }
  
  /** 
   * Find mulitple documents by their repective ID, and return a map
   * { ID1: item1,   ID2: item2, ... }
   * @param ids array of IDs
   * @return map from IDs to items
   */
  getByIdsAsMap(ids, params) {
    var result = {}
    var that = this
    return new Promise(function(resolve, reject) {
      that.getByIds(ids, params).then((items) => {
        items.forEach((item) => {
          result[that.getId(item)] = item
        })
        resolve(result)
      })  
    })
  }
  
  /**
   * find one or more items that match the given mongoDB query
   * @param query  e.g. { email: "user@host.com" }
   * @return a Promise that will resolve to the array of matched items
   */
  findByQuery(query, params) {
    var that = this
    if (!_.isString(query)) { 
      query = JSON.stringify(query)
    }
    var args = {
      parameters: _.merge(params, this.urlParams),
      path: { id: '' }
    }
    args.parameters.q = query
    return new Promise(function(resolve, reject) {
      console.log("findByQuery(query="+query+") => "+that.url, args)
      client.get(that.url, args, function(data, response) {
        if (data.length < 5)
          console.log("findByQuery(q=...) <= ", data)
        else 
          console.log("findByQuery(q=...) <= Array("+data.length+")")
        that.cachePut(data)   //put results of query into cache
        resolve(data)
      }).on('error', function (err) {
        reject('ERROR in BaseRestClient.findByQuery(query='+query+'):', err)
      })
    })
  }

  /**
   * Load the given item(from the cache if it is in there)
   * and then populate its attribute given by path. 
   * That attribute must be a foreign key, ie. the ID of a child document.
   * @param idOrItem If you pass a string, then the item will be fetched with getById(). Otherwise you can pass an item directly.
   * @param path name (or path) of attribute in parent document that points to id of child document
   * @return A Promise that will resolve to the parent document that has the the given path replaced/populated with the child document
   */
  populate(idOrItem, path, childService) {
    var that = this
    if (_.isString(idOrItem)) {   // if we got an ID, then fetch item and recoursively call populate
      return that.getById(idOrItem).then(function(item) { 
        return that.populate(item, path, childService) 
      })
    }
    var item = idOrItem   // now we have an item
    if (_.has(item, path+'._id')) { 
      console.log("=====> Already populated")
      return Promise.resolve(item)   // already populated
    }
    var childId = _.get(item, path+'.$oid')   //TODO:  $oid is mongoDB specific. Where to handle it?
    return childService.getById(childId).then(function(childItem) {
      _.set(item, path, childItem)
      return item
    })
  }
  
  /**
   * Populate the given path in all items
   */
  populateAll(idsOrItemArray, path, childService) {
    if (!_.isArray(idsOrItemArray)) throw new Error("Need array in populateAll()")
    if (idsOrItemArray.length == 0) return []
    for (var i = idsOrItemArray.length; i--; ) {
      if (_.isString(idsOrItemArray[i])) {
        idsOrItemArray[i] = this.getById(idsOrItemArray[i])
      }
    }
    
  }

}

