/**
 * Client for Liquido backend API for LawModels (ideas, proposals and laws)
 *
 * @version 2.0 This is the new REST client with cachingInterceptor.js
 *
 * This is the client side for the spring data jpa rest data repository in
 * org.doogie.liquido.datarepos.LawRepo
 *
 * This class is meant to be used as a singleton!
 *
 */


/* 
// CuJoJs Rest Client  https://github.com/cujojs/rest and some of its interceptors (they are cool. That's why I decided to use this REST lib.
import rest       from 'rest'
import mime       from 'rest/interceptor/mime'
import errorCode  from 'rest/interceptor/errorCode'
import pathPrefix from 'rest/interceptor/pathPrefix'
import basicAuth  from 'rest/interceptor/basicAuth'
import cachingInterceptor     from './cachingInterceptor'       // cache requests by URL (with TTL)
import logRequestsInterceptor from './logRequestsInterceptor'   // very detailed loging of all HTTP requests and responses incl. payload

*/

//MAYBE:  'require' this in the main LiquidoApiClient, so that the exported methods get merged into $root.api ref
//The same was as cujorestjs does it here in this example: https://github.com/cujojs/rest/blob/master/browser.js

// load base client
import httpClient from './httpClient'
import loglevel from 'loglevel'
var log = loglevel.getLogger("pollApiClient");

//==================================================================================================================
// Initialize and setup
//==================================================================================================================

var client = httpClient.getClient()

// Keep in mind that all requests to the backend must be authenticated. So you must call client.setLogin() before making the first request.

//==================================================================================================================
// Module private methods
//==================================================================================================================



//==================================================================================================================
// Public/Exported methods
//==================================================================================================================

module.exports = {
  
  /**
   * get polls that are currently in their voting phase
   * @return a list of polls that can be voted on
   */
  getOpenForVotingPolls() {
    log.debug("getOpenForVotingPolls()")
    return client('/polls/search/findByStatus?status=VOTING')
    .then(
      response => { return response.entity._embedded.polls }
    )
    .catch(err => {
      log.error("ERROR in pollApiClient: ", JSON.stringify(err))
      return Promise.reject("pollApiClient: Cannot getOpenForVotingPolls()")
    }) 
  },



  /** 
   * fetch all alternative proposals of the given proposal
   * @param proposalSelector a proposal or proposal URI (not necessarily the initial proposal itself)
   * @return a list of alternative competing proposals
   */
  getPoll(pollSelector) {
    log.debug("loadPoll", pollSelector)
    var pollURI = this.getURI(pollSelector)
    return client(pollURI).then(
      response => { return response.entity }
    )
    /*
    return client('/laws/search/findCompeting?proposal='+proposalURI).then(
      response => { return response.entity._embedded.laws }
    )
    */
  },

  /** called when a user casts a vote. Will either insert a new ballot or update the existing one .
   * Exmaple payload for newBallot:
   *   {
   *    "initialProposal": "/liquido/v2/laws/42",
   *     "voteOrder": [
   *       "/liquido/v2/laws/42",
   *       "/liquido/v2/laws/43"
   *     ]
   *   }
   */
  postBallot(newBallot) {
    log.debug("postBallot: "+JSON.stringify(newBallot))
    return client({
      method: 'POST',
      path: '/postBallot',
      headers: { 'Content-Type' : 'application/json' },
      entity: newBallot
    })
    .then(
      response => { return response.entity }
    )
  },


}