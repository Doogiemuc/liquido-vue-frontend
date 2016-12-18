/**
 * Mocha unit tests for IdeaService (and also for BaseRestClient)
 * This test cases will run inside PhantomJS, a headleas browser.
 */

/* global expect */
var userService = require('src/services/UserService')
var ideaService = require('src/services/IdeaService')
var log = require("loglevel").getLogger("IdeaService.spec.js");

//if (process.env.NODE_ENV == 'testing') {
//  log.debug("================ SETTING LOG LEVEL in IdeaService.spec.js")
//  log.setLevel("trace")  // trace == log everything
//}

describe('IdeaService', () => {
  var numTestIdeas = 10
  var ideas

  //You can run a single KARMA test case with   it.only(...)

  // MochaJS "before all hock": this runs once before all tests in this block (should be called beforeAll :-)
  before(function() {
    this.timeout(5000)
    //setTimeout(done, 5000)
    var params = { l: numTestIdeas }  // get first 10 ideas
    log.debug("Fetching first "+numTestIdeas+" ideas")
    //MAYBE: chai-promised: return ideaService.getAll().should.eventually.have.length.of.at.least(5)
    return ideaService.getAll(params).then(result => {
      ideas = result
      log.debug("========= got "+result.length+" ideas in BEFORE")
    })
  })

  it('should have gotten list of '+numTestIdeas+' ideas', () => {
    expect(ideas).to.be.instanceof(Array)
    expect(ideas).to.have.length(numTestIdeas)
    //TODO: validate an idea
  })

  it('should be able to create a new Idea and then delete it', () => {
    var getOneUser = function() {
      return userService.findByQuery({email: 'testuser0@liquido.de'})
      .then(foundUsers => { return foundUsers[0] })
    }
    var createNewIdea = function(user) {
      log.debug("ENTER createNewIdea testStep    user="+JSON.stringify(user))
      var newIdea = {
        title: 'Idea from test case '+new Date().getTime(),
        description: 'Some dummy description that looks very cool and is long enough',
        createdBy: user._id,
        //createdAt and updatedAt timestamps will be set automatically by ideaService
      }
      return ideaService.insertNewItem(newIdea).then(function(createdIdea) {
        //log.debug("createdIdea\n", createNewIdea)
        return createdIdea
      })
    }
    var deleteIdea = function(idea) {
      //log.debug("ENTER deleteIdea testStep ideaToDelete=", idea)
      return ideaService.deleteById(idea._id.$oid).then(function(deletedIdea) {
        log.debug("deletedIdea:\n", deletedIdea)
        return deletedIdea
      })
    }
    return getOneUser().then(createNewIdea).then(deleteIdea)

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
      //log.debug("reloadIdeafromDB")
      var params = { l : 1 }
      return ideaService.getAll(params).then(function(result) {    // getAll does not use cache!
        expect(result).to.have.length(1)
        expect(result[0]).to.have.deep.property('createdBy.$oid')
        return result[0]  // return unpopulated idea
      })
    }
    var populateIdea = function(idea) {
      //log.debug("populateIdea")
      //log.debug("idea===\n", JSON.stringify(idea, ' ', 2))
      return ideaService.populate(idea, 'createdBy', userService).then((populatedIdea) => {
        //log.debug("populatedIdea===\n", JSON.stringify(populatedIdea, ' ', 2))
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
      return ideaService.populateAll(ideas, 'createdBy', userService).then((populatedIdeas) => {
        //log.debug("populatedIdeas from populateAll\n\n", JSON.stringify(populatedIdeas, ' ', 2))
        expect(populatedIdeas[2]).to.have.deep.property('createdBy.email')
        expect(populatedIdeas[2]).to.have.deep.property('createdBy.profile.name')
      })
    }
    return prePopulateOneIdea().then(populateAllIdeas)
  })


})
