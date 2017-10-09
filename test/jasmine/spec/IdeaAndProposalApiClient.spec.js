/**
 * Smoke tests for IdeaAndProposalApiClient.js
 * Will also test the cachingInterceptor.js
 * 
 * These tests will run with jasmin as plain node javascript - no browser involved
 * So you cannot test any real HTML DOM frontend here. But you can do unit tests of backend services very quickly.
 */

/*global expect, jasmine, iit, fail*/

import moment from 'moment'
import * as cachingInterceptor from '../../../src/services/cachingInterceptor'
import loglevel from 'loglevel'
var log = loglevel.getLogger("IdeaAndProposalApiClient");


var handleError = function(err) {
  log.error("ERROR in 222IdeaAndProposalApiClient.spec jasmine test", JSON.stringify(err));
  done.fail(err);
}


var apiClient = require('../../../src/services/IdeaAndProposalApiClient.js');
//apiClient.setLogin('testuser0@liquido.de', 'dummyPasswordHash')

describe("IdeaAndProposalApiClient", function() {

  beforeAll(function(done) {
    /*
    var email = "testuser0@liquido.de"
    log.debug("Fetch default user "+email)
    apiClient.findUserByEmail(email).then(
      user => {
      	log.debug("received user "+user) 
        this.currentUser = user 
        done()
      }
    ).catch(handleError)
    */
    done()
  })

  beforeEach(function() {
    log.debug("beforeEach(): Flushing cache")
    cachingInterceptor.flush()
  });

  /*
  it('is a Singleton instance', function() {
    var apiClient = require('../../../src/services/IdeaAndProposalApiClient.js');
    expect(apiClient).toEqual(apiClient);
  })
  */

  it('should get proposals that reached their quorum', function(done) {
    var twoWeeksAgo = moment().subtract(2, 'weeks').format("YYYY-MM-DD")
    apiClient.getReachedQuorumSince(twoWeeksAgo).then(ideas => {
      expect(ideas).toBeArrayOfObjects();
      expect(ideas.length >= 2).toBeTruthy("Expected to receive at least 2 proposals that reached their quorum.")  
      done()
    })
    .catch(done.fail)
  })

  it('should cache responses for getReachedQuorumSince', function(done) {
    var twoWeeksAgo = moment().subtract(2, 'weeks').format("YYYY-MM-DD")
    apiClient.getReachedQuorumSince(twoWeeksAgo).then(ideas => {
      var cachedElem = cachingInterceptor.getFromCache(process.env.backendBaseURL+"/laws/search/reachedQuorumSince?since="+twoWeeksAgo)
      var cachedProposal = cachedElem.response.entity._embedded.laws[0]
      expect(cachedProposal.status).toEqual("PROPOSAL")                      // Did I mention that I love jasmine's english !!! :-)
      done()
    })
    .catch(done.fail);
  })

})
