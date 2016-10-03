/**
 * Smoke tests for UserService
 *
 * These tests will run with jasmin as plain node javascript - no browser involved
 * So you cannot test any real HTML DOM frontend here. But you can do unit tests of backend services very quickly.
 */
"user strict"
/*global jasmine, expect, fail, fit */
var log = require("loglevel").getLogger("DelegationService.jasmine.spec.js");

var handleError = function(err) {
  console.error("ERROR in test", err)
  fail(err)
}

describe("DelegationService", function() {

  var pathPrefix = '../../../src'
  var delegationService = require(pathPrefix+'/services/DelegationService')
  var userService = require(pathPrefix+'/services/UserService')
  var areaService = require(pathPrefix+'/services/AreaService')

  /**
   * Each test will get its own freshly new IdeaService instance (with a clean cache).
   * Tests must be indipendant of each other!
   */
  beforeEach(function() {
    delegationService.cache = {}
  });

  var testuser0 = 'testuser0@liquido.de'
  it('should find the proxies of '+testuser0, function(done) {
    var findTestUser0 = function() {
      var userQuery = { email: testuser0 }
      return userService.findOne(userQuery)
    }
    var checkProxies = function(testUser) {
      expect(testUser.email).toBeDefined()
      return delegationService.getAllProxiesOf(testUser._id.$oid).then((proxies) => {
        log.debug("found "+proxies.length+" proxies")
        expect(proxies.length >= 1).toBeTruthy("Expected to find at least 1 proxy")
      })
    }
    findTestUser0().then(checkProxies).then(done).catch(handleError)
  })

  it('should get the number of votes a proxy can cast (incl. transitive proxies)', function(done) {
    var findTestUser = function() {
      log.debug("Querying for user")
      var userQuery = { email: 'testuser4@liquido.de' }
      return userService.findOne(userQuery)
    }
    var findTestArea = function() {
      log.debug("Querying for Area ")
      var areaQuery = { title: 'Area 1' }
      return areaService.findOne(areaQuery)
    }
    var checkNumberOfVotes = function(testUser, testArea) {
      expect(testUser.email).toBeDefined("No testUser found")
      expect(testArea.title).toBeDefined("No testArea found")
      return delegationService.getNumberOfVotes(testUser._id.$oid, testArea._id.$oid).then((numDelegations) => {
        expect(numDelegations).toBe(5, "expected to find 5 delegations (including transitive proxies)")
      })
    }

    Promise.all([findTestUser(), findTestArea()]).then(result =>  {
      return checkNumberOfVotes(result[0], result[1])
    })
    .then(done).catch(handleError)
  })

})
