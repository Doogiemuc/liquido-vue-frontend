/**
 * Mocha unit tests for IdeaService (and also for BaseRestClient)
 * This test cases will run inside PhantomJS, a headleas browser.
 */

/* global expect */
import IdeaService from 'src/services/IdeaService'
import UserService from 'src/services/UserService'

describe('IdeaService', () => {
  var ideaService
  var userService
  var numTestIdeas = 10
  var ideas
  
  //You can run single tests with   it.only(...)

  before(function(done) {
    this.timeout(5000)
    setTimeout(done, 5000)
    ideaService = new IdeaService()
    userService = new UserService();  
    var params = { l: numTestIdeas }  // get first 5 ideas
    console.log("Fetching first "+numTestIdeas+" ideas")  
    //MAYBE: chai-promised: return ideaService.getAll().should.eventually.have.length.of.at.least(5)
    ideaService.getAll(params).then((result) => {
      ideas = result
      done()
    })
  })
  
  it('should have gotten list of 10 ideas', () => {
    expect(ideas).to.be.instanceof(Array)
    expect(ideas).to.have.length(numTestIdeas)
  })
  
  it.only('should create a newItem and delete it', () => {
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
        console.log("createdIdea\n", createNewIdea)
      })
    }
    var deleteIdea = function(idea) {
      console.log("ENTER deleteIdea testStep")
      return ideaService.deleteIdea(idea._id.$oid).then(function(deletedIdea) {
        console.log("deletedIdea:\n", deletedIdea)
      })
    }
    return createNewIdea().then(deleteIdea)

  })
  
  it('should get idea by ID and cache it', () => {
    var id = ideas[0]._id.$oid
    return ideaService.getById(id).then((idea) => {
      expect(idea).to.have.deep.property('_id.$oid', id)
      expect(ideaService.cache[id]).to.deep.equal(idea)
      return idea
    })
  })

  it('should get ideas as map from list of Ids (no cache)', () => {
    var idList = ideas.map(idea => idea._id.$oid)
    return ideaService.getByIdsAsMap(idList, {}, /*nocache:*/true).then(function(result) {
      for (var i = numTestIdeas; i--; ) {
        var id = ideas[i]._id.$oid
        expect(ideas[i]).to.deep.equal(result[id])
      }
    })
  })

  it('should query for ideas', () => {
    var query = { title: { $regex: 'Idea' } }
    var params = { l: 2 }  // limit to 2 results
    return ideaService.findByQuery(query, params).then((ideas) => {
      expect(ideas).to.be.instanceof(Array)
      expect(ideas).to.have.length(2)
    })
  })

  it('should populate idea.createdBy with user and then recognize already populated attribute', function() {
    this.timeout(5000)
    var reloadIdeafromDB = function() {
      console.log("reloadIdeafromDB")
      var params = { l : 1 }
      return ideaService.getAll(params).then(function(result) {    // findAll does not use cache!
        expect(result).to.have.length(1)
        expect(result[0]).to.have.deep.property('createdBy.$oid')
        return result[0]  // return unpopulated idea
      })
    }
    var populateIdea = function(idea) {
      console.log("populateIdea")
      return ideaService.populate(idea, 'createdBy', userService).then((populatedIdea) => {
        //console.log("populatedIdea", JSON.stringify(populatedIdea, ' ', 2))
        expect(populatedIdea).to.have.deep.property('createdBy.email')
        expect(populatedIdea).to.have.deep.property('createdBy.profile.name')
        return idea
      })
    }
    return reloadIdeafromDB().then(populateIdea).then(populateIdea)   // populate twice!
  })
  
  it('should populate createdBy in list of ideas (and recognize already populated item in list)', function() {
    this.timeout(5000)
    var prePopulateOneIdea = function() {
      return ideaService.populate(ideas[0], 'createdBy', userService)
    }
    var populateAllIdeas = function() {
      console.log("populateAll")
      return ideaService.populateAll(ideas, 'createdBy', userService).then((populatedIdeas) => {
        //console.log("populatedIdeas from populateAll\n\n", JSON.stringify(populatedIdeas, ' ', 2))
        expect(populatedIdeas[2]).to.have.deep.property('createdBy.email')
        expect(populatedIdeas[2]).to.have.deep.property('createdBy.profile.name')
      })
    }
    return prePopulateOneIdea().then(populateAllIdeas)
  })
  
  
})
