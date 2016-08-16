/**
 * Smoke tests for UserService
 *
 * These tests will run with jasmin as plain node javascript - no browser involved
 * So you cannot test any real HTML DOM frontend here. But you can do unit tests of backend services very quickly.
 */
"user strict"
/*global expect, fail*/


var handleError = function(err) {
  console.error("ERROR in test", err)
  fail(err)
}

describe("DelegationService", function() {

  var delegationService = require('../../../src/services/DelegationService')
  var userService = require('../../../src/services/UserService')
  
  /**
   * Each test will get its own freshly new IdeaService instance (with a clean cache).
   * Tests must be indipendant of each other!
   */
  beforeEach(function() {
    delegationService.cache = {}
  });


  it('should find the three proxies of testUser0', function(done) {
    var findTestUser0 = function() {
      var userQuery = { email: 'testuser0@liquido.de' }
      return userService.findOne(userQuery)
    }
    var checkProxies = function(testUser) {
      expect(testUser.email).toBeDefined()
      return delegationService.getProxies(testUser).then((proxies) => {
        //console.log("found proxies", proxies.length >= 3)
        expect(proxies.length >= 3).toBeTruthy()
      })
    }
    
    findTestUser0().then(checkProxies).then(done).catch(handleError)
  })
  
  /*
  it('should get the number of votes a proxy can cast', function(done) {
    //delegationService.getNumberOfVotes(user, area)
    
  })
  */
})
