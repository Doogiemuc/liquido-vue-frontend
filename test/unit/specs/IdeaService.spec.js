/* global expect */
//You can run single tests with   it.only(...)

import IdeaService from 'src/services/IdeaService'
import UserService from 'src/services/UserService'

/**
 * Mocha unit tests for IdeaService (and also for BaseRestClient)
 */
describe('IdeaService', () => {
  var ideaService
  var userService
  var ideas

  before(function(done) {
    this.timeout(5000)
    setTimeout(done, 5000)
    ideaService = new IdeaService()
    userService = new UserService();  
    var params = { l: 10 }  // get first 10 ideas
    console.log("Fetching first 10 ideas")  
    //MAYBE: chai-promised: return ideaService.getAll().should.eventually.have.length.of.at.least(5)
    ideaService.getAll(params).then((result) => {
      ideas = result
      done()
    })
  })
  
  it('should have gotten list of 10 ideas', () => {
    expect(ideas).to.be.instanceof(Array)
    expect(ideas).to.have.length(10)
  })
  
  it('should get idea by ID and cache it', () => {
    var id = ideas[0]._id.$oid
    return ideaService.getById(id).then((idea) => {
      expect(idea).to.have.deep.property('_id.$oid', id)
      expect(ideaService.cache[id]).to.deep.equal(idea)
      return idea
    })
  })

  it('should get ideas as map from list of Ids', () => {
    var idList = ideas.map(idea => idea._id.$oid).slice(0, 5)
    return ideaService.getByIdsAsMap(idList).then(function(result) {
      for (var i = 5; i--; ) {
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

  it('should populate child doc', function() {
    this.timeout(5000)
    expect(ideas[0]).to.have.deep.property('createdBy.$oid')
    return ideaService.populate(ideas[0]._id.$oid, 'createdBy', userService).then((populatedIdea) => {
      //console.log("populatedIdea", JSON.stringify(populatedIdea, ' ', 2))
      expect(populatedIdea).to.have.deep.property('createdBy.email')
      expect(populatedIdea).to.have.deep.property('createdBy.profile.name')
    })
  })
  
})
