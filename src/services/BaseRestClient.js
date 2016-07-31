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
    this.nameOfIdAttr = nameOfIdAttr || '_id'
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
        console.log("getAll() <= ", data)
        data.forEach((item) => {
          that.cache[that.getId(item)] = item
        })
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
    if (!nocache && this.cache[id] !== undefined) {
      return Promise.resolve(this.cache[id])
    }
    var that = this
    var args = {
      parameters: _.merge(params, this.urlParams),
      path: { id: id }
    }
    return new Promise(function(resolve, reject) {
      console.log("getById(id="+id+") => "+that.url, args)
      client.get(that.url, args, function(data, response) {
        console.log("getById(id="+id+") <= ", data)
        that.cache[id] = data  // remember item in cache
        resolve(data)
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
   *  4. Merge results from cache and DB
   * 
   * @param ids array of IDs
   * @return array of found items
   */
  getByIds(ids, params) {
    //console.log("getByIds", ids, params)
    if (!_.isArray(ids)) throw new Error("Param for getByIds must be Array.")
    var that = this
    var result = []
    var notInCacheIds = []
    ids = _.uniq(ids)
    //----- get items from cache, where possible
    ids.forEach((id) => {
      if (this.cache[id] !== undefined) {
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
          //TODO: put it into the cache
        })
        resolve(result)
      })  
    })
  }
  
  /**
   * find one or more items that match the given mongoDB query
   * @param query  e.g. { email: "user@host.com" }
   */
  findByQuery(query, params) {
    var that = this
    /*
    if (!_.isString(query)) { 
      console.log("calling JSON stringify on ", query)
      query = JSON.stringify(query)
      console.log("and got ", query)
    }*/
    var args = {
      parameters: _.merge(params, this.urlParams),
      path: { id: '' }
    }
    args.parameters.q = query
    return new Promise(function(resolve, reject) {
      console.log("findByQuery(query="+query+") => "+that.url, args)
      client.get(that.url, args, function(data, response) {
        console.log("findByQuery(q=...) <= ", data)
        resolve(data)
      }).on('error', function (err) {
        reject('ERROR in BaseRestClient.findByQuery(query='+query+'):', err)
      })
    })
  }

  /**
   * Load the item with the given Id (from the cache if it is in there)
   * and then populate its attribute given by path. 
   * That attribute must be a foreign key, ie. the ID of a child document.
   * @param id id of parent docuemnt
   * @param path name (or path) of attribute in parent document that points to id of child document
   * @return the parent document that has the the given path replaced/populated with the child document
   */
  populate(id, path, childService) {
    var item = this.getById(id)
    var childId = _.get(item, path)
    if (_.isObject(childId)) return item   // already populated
    var childItem = childService.getById(childId)
    _.set(item. path, childItem)
    return item
  }
  
  //TODO: populateAll

}

