/**
 * Smoke tests for IdeaService (and BaseRestClient)
 * These tests will run with jasmin as plain node javascript - no browser involved
 * So you cannot test any real HTML DOM frontend here. But you can do unit tests of backend services very quickly.
 */

/*global expect, jasmine, fail*/

var handleError = function(err) {
  console.error("ERROR in test", err)
  fail(err)
}

describe("IdeaService", function() {
  var IdeaService = require('../../../src/services/IdeaService');
  var ideaService

  beforeEach(function() {
    ideaService = new IdeaService()
  });

  it("should get all ideas", function(done) {
    ideaService.getAll().then(function(ideas) {
      expect(ideas.length > 10).toBeTruthy("Expected to receive more than 10 ideas")
      done()
    }).catch(handleError)
  })
  
  it('should post a new idea and then delete it', (done) => {
    var createNewIdea = function() {
      console.log("ENTER createNewIdea testStep")
      var newIdea = {
        title: 'Idea from test case',
        description: 'Some dummy description timestamp='+new Date().getTime(),
        //TOOD: createdBy: { $oid: '....'},
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      return ideaService.postItem(newIdea).then(function(createdIdea) {
        //console.log("createdIdea\n", createdIdea)
        return createdIdea
      })
    }
    var deleteIdea = function(idea) {
      console.log("ENTER deleteIdea testStep id="+idea._id.$oid)
      return ideaService.deleteById(idea._id.$oid).then(function(deletedIdea) {
        console.log("Successfully deleted idea.")
        return deletedIdea
      })
    }
    createNewIdea().then(deleteIdea).then(done).catch(handleError)  // I couldn't believe that jasmine doesn't handle failed promises on its own
  })
})
