/**
 * Smoke tests for IdeaService (and BaseRestClient)
 * These tests will run with jasmin as plain node javascript - no browser involved
 * So you cannot test any real HTML DOM frontend here. But you can do unit tests of backend services very quickly.
 */

/*global expect, jasmine, iit, fail*/

var handleError = function(err) {
  console.error("ERROR in test", err);
  fail(err);
}

var liquidoCache = require('../../../src/LiquidoCache');

describe("LiquidoCache", function() {

  beforeEach(function() {
    //liquidoCache.flush()
  });

  it('is a Singleton instance', function() {
    var liquidoCache2 = require('../../../src/LiquidoCache.js');
    expect(liquidoCache).toEqual(liquidoCache2);  // including cache!
  })

  it('should fetch and cache all ideas', function(done) {
    liquidoCache.fetchAllIdeas().then(ideas => {
      expect(ideas.length > 10).toBeTruthy("Expected to receive more than 10 ideas.")
      var cachedIdeas = liquidoCache.getCache().get('populatedIdeas')
      expect(cachedIdeas).toBeDefined("Expected ideas to have been cached.")
      done()
    })
    .catch(handleError);
  })

  it('should fetch a proxy map', function(done) {
    var userId = "577a00533d5b352b9b000c29";  // Test User1
    var areaId = "57892d793d5b352b9b0134be";  // Area 1
    var proxyName = "Test User4"
    liquidoCache.fetchProxyMap(userId).then(proxyMap => {
      var proxy = proxyMap[areaId];
      expect(proxy.profile.name).toEqual(proxyName, "Proxy of Test User1 in Area1 should have been Test User4")
      done()
    })
    .catch(handleError);
  })


})
