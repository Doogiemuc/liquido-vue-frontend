//http://mongodb.github.io/node-mongodb-native/2.0/api/Collection.html#bulkWrite

var MongoClient = require('mongodb').MongoClient


var ideaUpserts = [
  { updateOne: {
    filter: {title:'Idea 1'},
    update: {title: "Idea 1", description: "upserted description"},
    upsert: true }
  }
]

MongoClient.connect('mongodb://localhost:27017/test', function(err, db) {
  if (err) {
    console.error(err)
    return
  }

  // Get the collection
  var col = db.collection('delegations');
  col.bulkWrite(ideaUpserts, {ordered:true, w:1})
  .then(function(r) {
    console.log(r)

    test.equal(1, r.nInserted);
    test.equal(2, r.nUpserted);
    test.equal(0, r.nRemoved);

    // Crud fields
    test.equal(1, r.insertedCount);
    test.equal(1, Object.keys(r.insertedIds).length);
    test.equal(1, r.matchedCount);
    test.equal(0, r.modifiedCount);
    test.equal(0, r.deletedCount);
    test.equal(2, r.upsertedCount);
    test.equal(2, Object.keys(r.upsertedIds).length);

    // Ordered bulk operation
    db.close();
  });
});