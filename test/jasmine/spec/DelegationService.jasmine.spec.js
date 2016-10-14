/**
 * Smoke tests fo DelegationService (imlemented withJasmine)
 *
 * These tests will run with jasmin as plain node javascript - no browser involved
 * So you cannot test any real HTML DOM frontend here. But you can do unit tests of backend services very quickly.
 */
"user strict"
/*global jasmine, expect, fail, fit */
var loglevel = require("loglevel")
var log = loglevel.getLogger("DelegationService.jasmine.spec.js");

loglevel.getLogger("DelegationService").setLevel("TRACE");  // enable full debug logging in module under test

var handleError = function(err) {
  console.error("ERROR in test", err)
  fail(err)
}

describe("DelegationService", function() {

  var pathPrefix = '../../../src'
  var delegationService = require(pathPrefix+'/services/DelegationService')
  var userService = require(pathPrefix+'/services/UserService')
  var areaService = require(pathPrefix+'/services/AreaService')

  // Test fixtures
  var USER0_EMAIL = 'testuser0@liquido.de'
  var USER4_EMAIL = 'testuser4@liquido.de'
  var USER4_NUM_VOTES = '5';

  /**
   * Each test will get its own freshly new IdeaService instance (with a clean cache).
   * Tests must be indipendant of each other!
   */
  beforeEach(function() {
    delegationService.cache = {}
  });


  it('should find proxies of '+USER0_EMAIL, function(done) {
    var getTestUser = function() {
      var userQuery = { email: USER0_EMAIL }
      return userService.findOne(userQuery)
    }
    var checkProxies = function(testUser) {
      log.debug("got user "+testUser)
      expect(testUser.email).toBeDefined()
      return delegationService.getDelegationsFrom(testUser._id.$oid).then(proxies => {
        expect(proxies).not.toBe(null)
        log.debug("found "+proxies.length+" proxies of "+USER0_EMAIL)
        expect(proxies.length >= 1).toBeTruthy("Expected to find at least 1 proxy of "+USER0_EMAIL)
      })
    }
    getTestUser().then(checkProxies).then(done).catch(handleError)
  })

  it('should get the number of votes that a proxy can cast (incl. transitive proxies)', function(done) {
    var findTestUser = function() {
      log.debug("Querying for user "+USER4_EMAIL)
      var userQuery = { email: USER4_EMAIL }
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
      log.debug("sending request for getNumberOfVotes")
      return delegationService.getNumberOfVotes(testUser._id.$oid, testArea._id.$oid).then(numVotes => {
        expect(numVotes).toBe(USER4_NUM_VOTES, "expected to get "+USER4_NUM_VOTES+" votes for user "+USER4_EMAIL)
      })
    }

    Promise.all([findTestUser(), findTestArea()]).then(result => {
      return checkNumberOfVotes(result[0], result[1])
    })
    .then(done)
    .catch(handleError)
  })

})
