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

  it('should fetch all ideas', function(done) {
    liquidoCache.fetchAllIdeas().then(ideas => {
      expect(ideas.length > 10).toBeTruthy("Expected to receive more than 10 ideas")
      done()
    })
    .catch(handleError);
  })
})
