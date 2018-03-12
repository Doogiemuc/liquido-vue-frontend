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

//TODO:  'require' this in the main LiquidoApiClient, so that the exported methods get merged into $root.api ref
//The same was as cujorestjs does it here in this example: https://github.com/cujojs/rest/blob/master/browser.js
 
// CuJoJs Rest Client  https://github.com/cujojs/rest and some of its interceptors (they are cool. That's why I decided to use this REST lib.
import rest       from 'rest'
import mime       from 'rest/interceptor/mime'
import errorCode  from 'rest/interceptor/errorCode'
import pathPrefix from 'rest/interceptor/pathPrefix'
import basicAuth  from 'rest/interceptor/basicAuth'
import cachingInterceptor     from './cachingInterceptor'       // cache requests by URL (with TTL)
import logRequestsInterceptor from './logRequestsInterceptor'   // very detailed loging of all HTTP requests and responses incl. payload

import loglevel from 'loglevel'
var log = loglevel.getLogger("IdeaAndProposalApiClient");

//==================================================================================================================
// Initialize and setup
//==================================================================================================================

/** Sanity check */
if (process.env.backendBaseURL === undefined) {
  throw new Error("process.env.backendBaseURL must be defined!")
}

/** 
 * The CuJoJS rest client with its interceptors
 * !!!!! The order of these interceptors is EXTREMELY important !!!!!
 */
var client = rest.wrap(mime, { mime: 'application/json'} )  // then convert entity according to mime type
//                 .wrap(cachingInterceptor)      // caching interceptor must be BEFORE the mime interceptor!
                 .wrap(errorCode)               // Promise.reject() responses with http status code >= 400 
//                 .wrap(logRequestsInterceptor, { logPayload: true })  // first of all log the request
                 .wrap(pathPrefix, { prefix: process.env.backendBaseURL })  // add path prefix to request
                 
                 
// Keep in mind that all requests to the backend must be authenticated. So you must call this.setLogin() before making the first request.

//==================================================================================================================
// Module private methods
//==================================================================================================================



//==================================================================================================================
// Public/Exported methods
//==================================================================================================================

module.exports = {
  
  /** 
   * login a given user. Every future request will send these credentials with HTTP BasicAuth.
   * You MUST call this before you can use any other mehtod in this module!
   */
  setLogin(username, password) {
    log.debug("User login: "+username)
    client = client.wrap(basicAuth, { username: username, password: password });
  },
  
 
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


}