var creds = require('../../config/credentials');
var MongoClient = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;
var _ = require('lodash');
var testData = require('./testData').testData;


// Standard URI format: mongodb://[dbuser:dbpassword@]host:port/dbname
var uri = 'mongodb://'+creds.mongouser+':'+creds.mongopass+'@ds019664.mlab.com:19664/liquido-test';

/** 
 * iterate over the values of item.update,
 * look for references marked with "$ref"
 * and resolve them by executing $ref.query
 * and replace the value with the found ID.
 * //TODO: or array of IDs.
 * @param db MongoClient
 * @param item update operation from seedData that may contain $ref values
 * @return a Promise.all() that will unwind all refs
 */
var unwindRefs = function (db, item) {
  var refsToResolve = [];
  
  // replace a value.$ref with the referenced ObjectID
  var unwindRefValue = function(item, key, value) {
    return db.collection(value.$ref.collection)
      .findOne(value.$ref.query)
      .then((doc) => {
        console.log("   unwindRefValue: key "+key+" in", item.query, "was a $ref to '"+value.$ref.collection+"'", value.$ref.query, "and is ID="+doc._id);
        item.update[key] = new ObjectID(doc._id);  // replace item.update.key.$ref: {...} with found MongoDB ObjectId

        //TODO: cache already resolved refs and cache their IDs for later. This will especially speed up the frequent refs to 'users'

        return doc._id;
      });
  };

  // loop over the keys of item.update and look for $ref values
  var checkForRefs = function(item) {
    _.forOwn(item.update, function(value, key) {
      //console.log("checking "+key+"="+value);
      if (_.isPlainObject(value) && _.has(value, '$ref')) {
        //console.log("checkForRefs: key "+key+" in ", item.query, " is ref to '"+value.$ref.collection+"' with query ", value.$ref.query);
        refsToResolve.push(unwindRefValue(item, key, value));
      } /*else   //TODO: unwind an array of refs
      if (_.isArray(value)) {
        value.forEach((elem) => {
          if (_.isPlainObject(value) && _.has(value, '$ref')) {
            console.log("  found ref to '"+value.$ref.collection+"' with query ", value.$ref.query, "in array elem");
            refsToResolve.push(unwindRefValue(db, key, value));
          }  
        });
      }*/
    });  
  };

  
  checkForRefs(item);

  // return a promise that will unwind all $ref values
  return Promise.all(refsToResolve)
    .catch(function(err) {
      console.error("ERROR in unwindRefs", err);
    });
};

/** upsert items in one collection */
var upsertCollection = function(db, upsertOps) {
  return Promise.all( 
    upsertOps.map( (item) => {
      console.log("Upserting "+item.collection+": ", item.query);
      var collection = db.collection(item.collection);

      // check for referencs in the update operations (item.update)
      return unwindRefs(db, item)

      // upsert item in DB
      .then(function() {
        console.log("== updateOne", item.query);
        //console.log("item.update=", item.update);
        return collection.updateOne(item.query, item.update, {upsert: true});
      })

      // log error, if any
      .catch(function(err) {
        console.error("ERROR in upsertCollection", err);
        throw err;
      });
    })
  );
};

/**
 * create testdata
 */
MongoClient.connect(uri).then(function(db) {

  var insertSeedData = function() {
    return upsertCollection(db, testData);
  };

  insertSeedData()
  .then(function(result) {
    console.log("done.");
    //console.log(JSON.stringify(seedData, ' ', 2));
    db.close();
  })
  .catch(function(err) {
    console.error("ERROR while seeding", err);
    db.close();
  });
});
