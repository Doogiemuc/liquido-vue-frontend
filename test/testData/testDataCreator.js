var creds = require('../../config/credentials');
var MongoClient = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;
var _ = require('lodash');
var liquidoSeedData = require('./liquidoSeedData.js');

// Standard URI format: mongodb://[dbuser:dbpassword@]host:port/dbname
var uri = 'mongodb://'+creds.mongouser+':'+creds.mongopass+'@ds019664.mlab.com:19664/liquido-test';

var handleError = function(err) {
  console.error("ERROR while seeding\n", err);
  console.error(err.stack)
}

/**
 * check if the upsertOp has any references in its query or update field
 * @param upsertOp  and mongo update operation
 * @return true if upsertOp.query or upsertOp.update contains a $ref value
 */
var hasRef = function(upsertOp) {
  var hasRef = false
  _.forOwn(upsertOp.query, function(value, key) {
    if (_.has(value, '$ref')) {
      hasRef = true
      return false;  // exit forOwn loop
    }
  })
  _.forOwn(upsertOp.update, function(value, key) {
    if (_.has(value, '$ref')) {
      hasRef = true
      return false;  // exit forOwn loop
    }
  })
  return hasRef
}

/**
 * unwind one reference obj[key].$ref
 * @param db db connection
 * @param obj object that contains the ref
 * @param key key that contains $ref
 * @return (A promise that will resolve, when) obj[key] is replaced with the ObjectId of the referenced doc
 */
var unwindOneRef = function(db, obj, key) {
   var ref = obj[key].$ref
   //console.log("unwindOneRef ", ref.collection, ref.query)
   return new Promise(function(resolve, reject) {
     db.collection(ref.collection)
     .findOne(ref.query)
     .then((doc) => {
       if (doc == undefined) {
         reject("Cannot resolve ref for key='"+key+"' to "+JSON.stringify(ref.query))
       }
       console.log("unwindOneRef '"+key+"' =>", ref.collection, ref.query, "=>", doc._id)
       obj[key] = new ObjectID(doc._id);  // replace obj[key] = { $ref {...} } with found MongoDB ObjectId: obj[key] = { _id: { $oid: 'asdf....' } }
       resolve(doc._id)
     })
   })
}

/**
 * Unwind all references in all updateOps
 * @param db db connection
 * @param upsertOps ARRAY of upsert operations
 * @return (A promise that will resolve to the) unwound upsertOps array
 */
var unwindAllRefs = function(db, upsertOps) {
  var tasks = []
  upsertOps.forEach((upsertOp) => {
    _.forOwn(upsertOp.query, function(value, key, obj) {
      if (_.has(value, '$ref')) {
        //console.log("unwindAllRefs.query: ", value)
        tasks.push(unwindOneRef(db, obj, key))
      }
    })
    _.forOwn(upsertOp.update, function(value, key, obj) {
      if (_.has(value, '$ref')) {
        //console.log("unwindAllRefs.update: ", value)
        tasks.push(unwindOneRef(db, obj, key))
      }
    })
  })
  console.log("Unwinding "+tasks.length+" refs.")
  return Promise.all(tasks).then(function(result) {
    console.log("Unwinding of "+tasks.length+" refs FINISHED")
    return upsertOps
  })
}

/**
 * execute a list of upsert operations
 * @param db ref to DB
 * @param upsertOps array of upsert operations with no $ref values (only alreay resolved refs)
 */
var executeUpserts = function(db, upsertOps) {
  console.log("Upserting "+upsertOps.length+" docs.")
  var tasks = upsertOps.map((upsertOp) => {
    var collection = db.collection(upsertOp.collection);
    return collection.updateOne(upsertOp.query, upsertOp.update, {upsert: true})
    .then(function(result) {
      console.log("upserted "+upsertOp.collection, upsertOp.query, "n=", result.result.n)
    })
  })
  return Promise.all(tasks).then(function() {
    console.log("Upserting "+upsertOps.length+" docs DONE.")
  })
  //MAYBE: //http://mongodb.github.io/node-mongodb-native/2.0/api/Collection.html#bulkWrite
}

/** insert seed data into the DB */
var seedDB = function(db, upsertOps) {
  var plainUpserts = []
  var upsertsWithRefs = []

  //---- split upsertOps into itmes with and without $refs
  upsertOps.forEach((upsertOp) => {
    if (hasRef(upsertOp)) {
      upsertsWithRefs.push(upsertOp)
    } else {
      plainUpserts.push(upsertOp)
    }
  })

  //----- first insert plainUpserts
  console.log("\n### upserting plain upsertOps (those without refs)")
  return executeUpserts(db, plainUpserts)

  //----- then unwind refs
  .then(function() {
    console.log("\n")
    return unwindAllRefs(db, upsertsWithRefs)
  })

  //----- then insert upsertsWithRefs
  .then((resolvedUpsertOps) => {
    console.log("\n#### Upserting upsertOps (with resolved refs)")
    return executeUpserts(db, resolvedUpsertOps)
  })


};




/**
 * Seed database with testdata
 */
console.log("Seeding Database ...")

MongoClient.connect(uri).then(function(db) {
  console.log("Connected to ", db.s.databaseName)
  //insertSeedData(db)
  try {
    seedDB(db, liquidoSeedData)
    .then(function(result) {
      console.log("done.");
    })
    .catch(handleError)
    .then(function() {
      db.close();
    });
  } catch (err) {
    console.error("Seeding failed with exception: ", err)   // This exception is not logged automatically!
    console.error(err.stack)
    db.close();
  }
}).catch(handleError)

// see also the new bulkWrite() method
// http://mongodb.github.io/node-mongodb-native/2.0/api/Collection.html#bulkWrite
