/**
 * Smoke tests for IdeaService (and BaseRestClient)
 * These tests will run with jasmin as plain node javascript - no browser involved
 * So you cannot test any real HTML DOM frontend here. But you can do unit tests of backend services very quickly.
 */

/*global expect, jasmine, iit, fail*/

var handleError = function(err) {
  console.error("ERROR in test", err);
  done.fail(err);
}

var liquidoApiClient = require('../../../src/services/LiquidoApiClient.js');
liquidoApiClient.login('testuser0@liquido.de', 'dummyPasswordHash')

describe("LiquidoApiClient", function() {

  beforeAll(function(done) {
    var email = "testuser0@liquido.de"
    console.log("Fetch default user "+email)
    liquidoApiClient.findUserByEmail(email).then(
      user => { 
        this.currentUser = user 
        done()
      }
    )
  })

  beforeEach(function() {
    //liquidoApiClient.getCache().flush()
  });

  it('is a Singleton instance', function() {
    var liquidoApiClient2 = require('../../../src/services/LiquidoApiClient.js');
    expect(liquidoApiClient).toEqual(liquidoApiClient2);
  })

  it('should fetch all areas', function(done) {
    liquidoApiClient.fetchAllAreas().then(areas => {
      expect(areas).toBeArrayOfObjects();
      expect(areas.length >= 10).toBeTruthy("Expected to receive at least 10 areas.")
      var cachedAreas = liquidoApiClient.getCache().get('allAreas')
      expect(cachedAreas).toBeDefined("Expected areas to have been cached.")
      done()
    })
    .catch(done.fail);
  })

  it('should fetch all ideas', function(done) {
    liquidoApiClient.fetchAllIdeas().then(ideas => {
      expect(ideas).toBeArrayOfObjects();
      expect(ideas.length >= 10).toBeTruthy("Expected to receive at least 10 ideas.")
      var cachedIdeas = liquidoApiClient.getCache().get('allIdeas')
      expect(cachedIdeas).toBeDefined("Expected ideas to have been cached.")
      done()
    })
    .catch(done.fail);
  })

  it('should fetch all users', function(done) {
    liquidoApiClient.fetchAllUsers().then(users => {
      expect(users).toBeArrayOfObjects();
      expect(users.length >= 10).toBeTruthy("Expected to receive at least 10 users.")
      var cachedUsers = liquidoApiClient.getCache().get('allUsers')
      expect(cachedUsers).toBeDefined("Expected users to have been cached.")
      done()
    })
    .catch(done.fail);
  })

  it('should find a user by email', function(done) {
    var email = "testuser0@liquido.de"
    liquidoApiClient.findUserByEmail(email).then(user => {
      expect(user).toBeNonEmptyObject()
      expect(user.email).toEqual(email, "Expected to find user with email '"+email+"'")
      done()
    })
    .catch(done.fail);
  })

  it('should get the proxy map of the current user', function(done) {
    liquidoApiClient.fetchProxyMap(this.currentUser).then(proxies => {
      expect(proxies).toBeNonEmptyObject("User "+this.currentUser.email+" should have at least one proxy")
      done()
    })
    .catch(done.fail);
  })
})
