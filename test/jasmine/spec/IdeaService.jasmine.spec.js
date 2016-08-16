/**
 * Smoke tests for IdeaService (and BaseRestClient)
 * These tests will run with jasmin as plain node javascript - no browser involved
 * So you cannot test any real HTML DOM frontend here. But you can do unit tests of backend services very quickly.
 */

/*global expect, jasmine, iit, fail*/

var handleError = function(err) {
  console.error("ERROR in test", err)
  fail(err)
}

describe("IdeaService", function() {
  var ideaService = require('../../../src/services/IdeaService');
  
  /**
   * Each test will get its own freshly new IdeaService instance (with a clean cache).
   * Tests must be indipendant of each other!
   */
  beforeEach(function() {
    ideaService.cache = {}
  });

  it('is a Singleton instance', function() {
    var ideaService2 = require('../../../src/services/IdeaService');
    expect(ideaService).toEqual(ideaService2)  // including cache!
  })

  it('should get all ideas and count them', function(done) {
    ideaService.getAll().then((ideas) => {
      expect(ideas.length > 10).toBeTruthy("Expected to receive more than 10 ideas")
      ideaService.count().then(function(countIdeas) {
        expect(countIdeas).toEqual(ideas.length)
        done()
      })
    }).catch(handleError)
  })
  
  
  it('should validate an idea', function(done) {
    var params = { l: 1 }
    ideaService.getAll(params).then(function(ideas) {
      var valid = ideaService.validate(ideas[0])
      expect(valid).toBeTruthy("Idea is not valid")
      done()
    })
  })
  
  it('should find one specific idea by title', function(done) {
    var query = { title: 'Idea 1' }
    console.log("send query")
    ideaService.findOne(query).then((idea) => {
      console.log("found idea")
      expect(idea.title).toEqual('Idea 1')
      done()
    })
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
        expect(createdIdea._id).toBeDefined()
        expect(createdIdea.title).toEqual(newIdea.title)
        return createdIdea
      })
    }
    var deleteIdea = function(idea) {
      //console.log("ENTER deleteIdea testStep id="+idea._id.$oid)
      return ideaService.deleteById(idea._id.$oid).then(function(deletedIdea) {
        //console.log("Successfully deleted idea.")
        expect(idea).toEqual(deletedIdea)
        return deletedIdea  //not used
      })
    }
    createNewIdea().then(deleteIdea).then(done).catch(handleError)  // I couldn't believe that jasmine doesn't handle failed promises on its own
  })
})
