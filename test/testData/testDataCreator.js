var creds = require('../../config/credentials');
var MongoClient = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;
var _ = require('lodash');

//based on http://stackoverflow.com/questions/13838441/javascript-how-to-calculate-the-date-that-is-2-days-ago#13838662

var daysAgo = function(nDays) {
  var daysAgo = new Date();
  daysAgo.setDate(daysAgo.getDate() - nDays);
  return daysAgo;
};

// constants
//TODO: move these to a central place
const LAW_PROPOSAL = 0;

// seed Data for upsert operations
var seedData = {};

// test users
seedData.users = [];
for(var i = 0; i<5; i++) {
  var user = {
    query:  {email: 'testuser'+i+'@liquido.de'},
    update: {
      email: 'testuser'+i+'@liquido.de',
      password: 'nopass',  // hashed password
      profile: {
        name: 'Test User'+i,
        website: 'http://www.liquido.de',
        picture: 'http://www.avatar.org/img'+i+'.png'
      },
      createdAt: daysAgo(20-i),
      updatedAt: daysAgo(19-i)
    }
  };
  seedData.users.push(user);
}

// create some ideas
seedData.ideas = [
  {
    query:  { title:"Idea 1" },
    update: {
      title:"Idea 1",
      description:"This is a rather long description for this idea",
      createdBy: { 
        "$ref": {
          collection: 'users',
          query: {email: 'testuser1@liquido.de'} 
        },
      },
      createdAt: daysAgo(5),
      updatedAt: daysAgo(5)
    }
  },
  

/*
  {
    query:  {title:"Idea 2"  },
    update: {title:"Idea 2",
             description:"This is a rather long description for this idea",
             createdAt: daysAgo(4),
             updatedAt: daysAgo(4) }
  },{
    query:  {title:"Idea 3"  },
    update: {title:"Idea 3",
             description:"This is a rather long description for this idea",
             createdAt: new Date(),
             updatedAt: new Date() }
  },
  
*/

];

// create some (proposals) for a law
seedData.laws = [
  {
    query:  {title:"Law 1"  },
    update: {
      title:"Law 1",
      description:"Genious proposal for a law",
      status: LAW_PROPOSAL,
      createdBy: "->seedData.users[0]._id",
      createdAt: daysAgo(5),
      updatedAt: daysAgo(1),
    }
  }
];


// Standard URI format: mongodb://[dbuser:dbpassword@]host:port/dbname
var uri = 'mongodb://'+creds.mongouser+':'+creds.mongopass+'@ds019664.mlab.com:19664/liquido-test';

/* upsert all the collections listed in seedData */
var upsert = function(db, seedData) {
  var tasks = [];
  for (var collectionName in seedData) {
    var collection = db.collection(collectionName);
    console.log("Upserting '"+collection.namespace+"'");
    tasks.push(upsertCollection(collection, seedData[collectionName]));
  }
  return Promise.all(tasks);
};

/** find the ID of a mongo document that matches the query */
var findIdByQuery = function(collection, query) {
  return collection.findOne(query).then((doc) => {
    return doc._id;
  });
};

/** 
 * iterate over the values of item.update,
 * look for references marked with "$ref"
 * and resolve them by executing $ref.query
 * and replace the value with the found ID.
 * //TODO: or array of IDs.
 */
var unwindRefs = function (db, collection, item) {
  var refsToResolve = [];
  _.forOwn(item.update, function(value, key) {
    //console.log("checking "+key+"="+value);
    if (_.isPlainObject(value) && _.has(value, '$ref')) {
      console.log("found ref to '"+value.$ref.collection+"' with query ", value.$ref.query);
      refsToResolve.push(
        db.collection(value.$ref.collection).findOne(value.$ref.query)
        .then((doc) => {
          console.log("  replacing with ID="+doc._id);
          item.update[key] = new ObjectID(doc._id);  // replace $ref with found _id
          return doc._id;  
        })
      );
    }
  });
  return Promise.all(refsToResolve)
    .catch(function(err) {
      console.error("ERROR in unwindRefs", err);
    });
};

/** upsert items in one collection */
var upsertCollection = function (db, collection, upsertOps) {
  return Promise.all( 
    upsertOps.map( (item) => {
      console.log("Upserting "+collection.collectionName+": ",item.query);
      
      // check for referencs in the update operations (item.update)
      return unwindRefs(db, collection, item)
      
      // then upsert the doc in the DB
      .then(collection.updateOne(item.query, item.update, {upsert: true}))

      // handle errors
      .catch(function(err) {
        console.error("ERROR in upsertCollection", err);
      });
      
    })
  );
};

MongoClient.connect(uri).then(function(db) {

  var createUsers = function() {
    return upsertCollection(db, db.collection('users'), seedData.users);
  };
  var createIdeas = function() {
    return upsertCollection(db, db.collection('ideas'), seedData.ideas);
  };
  
  createUsers()
  .then(createIdeas)
  
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
