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
    this.nameOfIdAttr = nameOfIdAttr || '_id'  // mongoDB has  '_id.$oid' in returned JSON
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
        console.log("ERROR in getAll()", err)
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
    console.log("getById(id="+id+") => "+this.url)
    if (!nocache && this.cacheGet(id) !== undefined) {
      console.log("getById(id="+id+") <= FROM CACHE ", this.cacheGet(id))
      return Promise.resolve(this.cacheGet(id))
    }
    var that = this
    var args = {
      parameters: _.merge(params, this.urlParams),
      path: { id: id }
    }
    return new Promise(function(resolve, reject) {
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
      console.log("getByIds(): Found all in cache")
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
  getByIdsAsMap(ids, params, nocache) {
    var result = {}
    var that = this
    return new Promise(function(resolve, reject) {
      that.getByIds(ids, params, nocache).then((items) => {
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
      console.log("findByQuery() => "+that.url, args)
      client.get(that.url, args, function(data, response) {
        if (data.length < 5)
          console.log("findByQuery() <= ", that.url, JSON.stringify(data, ' ', 2))
        else
          console.log("findByQuery() <= Array("+data.length+")")
        that.cachePut(data)   //put results of query into cache
        resolve(data)
      }).on('error', function (err) {
        reject('ERROR in BaseRestClient.findByQuery(query='+query+'):', err)
      })
    })
  }

  /**
   * Populate the given path: replace its value with the child doc.
   * 
   * Item in the DB may have references to other child items. Those references have
   * an mongo ObjectId as their value. When populated, then this reference is replaced
   * with the actual child doc. 
   * 
   * opulate its attribute given by path. 
   * That path must lead to a foreign key, ie. the ID of a child document:
   * 
   *     // before population
   *     parentDoc = {
   *       _id: { $oid: 'ID_OF_PARENT'},
   *       attr1: 'value1',
   *       refToChild: { $oid: 'ID_OF_CHILD_DOC' }
   *       [...]
   *     }
   * 
   *     populate(parentDoc, 'refToChild', childService).then((populatedChild) => { ... })
   * 
   *     // after population 
   *     populatedChild == {
   *       _id: { $oid: 'ID_OF_PARENT'},
   *       attr1: 'value1',
   *       refToChild: {
   *         _id: { $oid: 'ID_OF_CHILD'}
   *         childAttr1: 'val1'
   *         childAttr2: 'val2'
   *         [...]
   *       }
   *       [...]
   *     }
   * 
   *  Remark: Since parentDoc is only a reference, it will also point to the populated instance!
   * 
   * @param item item with child doc under path
   * @param path name (or path) of attribute in parent document that points to id of child document
   * @return (A Promise that will resolve to) the parent document that has the the given path replaced/populated with the child document
   */
  populate(item, path, childService) {
    if (_.has(item, path+'.'+childService.nameOfIdAttr)) { 
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
   * Populate the given path in all items.
   * 
   * This is highly optimized:
   *  1. collect a list of childIds (that are not yet populated)
   *  2. receive all child items for those childIds (will use cache in childService)
   *  3. replace all references with child items
   * 
   * @param itemArray array of items (need items. No ids!)
   * @param path path to child id that will be replaced/populated
   * @param childServie where to receive child items from
   * @return (A promise that will resolve to) a list of populated items
   */
  populateAll(itemArray, path, childService) {
    //console.log("ENTER populateAll")
    if (!_.isArray(itemArray)) throw new Error("Need array in populateAll()")
    //collect ids of not yet populated child items
    var childIds = [] 
    for (var i = itemArray.length; i--; ) {
      var alreadyPopulated = _.get(itemArray[i], path+"."+childService.nameOfIdAttr)  // When path._id exists, then the child object is already populated
      if (alreadyPopulated !== undefined) {
        //console.log("populateAll(path='+path+'): Found already populated item childId=", alreadyPopulated)
      } else {
        var childId = _.get(itemArray[i], path+'.$oid')        // path.$oid  is the not yet populated child id "reference"
        //console.log("will populate childId="+childId)
        childIds.push(childId)
      }
    }
    return childService.getByIds(childIds).then(function(result) {
      itemArray.forEach(function(item) {
        var childId = _.get(item, path+'.$oid')
        _.set(item, path, childService.cacheGet(childId))
      })
      return itemArray
    })

    /*  Shorter but unoptimized. Since we send all tasks at once, the childServcie's cache would not be used (if not already filled)
    var tasks = []
    idsOrItemArray.forEach(idOrItem => {
      tasks.push(this.populate(idOrItem, path, childService))
    })
    return Promise.all(tasks)
    */
  }

}

