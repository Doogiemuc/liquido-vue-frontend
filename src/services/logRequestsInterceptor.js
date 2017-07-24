/**
 * CuCoJS REST Client interceptor that log HTTP requests and responses with all details. (use for debugging)
 *
 * Usage: 
 *   import rest from 'rest'
 *   import logRequestsInterceptor from './logRequestsInterceptor' 
 *   var client = rest.wrap(logRequestsInterceptor)
 */

import loglevel from 'loglevel'
var log = loglevel.getLogger("logRequestsInterceptor");
var interceptor = require('rest/interceptor');

var reqId
var startTime

export default interceptor({
  
  init: function (config) {
    config.requestPrefix  = config.requestPrefix  || '=> '
    config.responsePrefix = config.responsePrefix  || '<= '
    config.logErrors      = config.logErrors    || true
    config.logRequests    = config.logRequests  || true
    config.logResponses   = config.logResponses || true
    config.logPayload     = config.logPayload   || true
    config.maxPayloadLength = config.maxPayloadLength || 400
    return config;
  },

  request: function (request, config, meta) {
    if (config.logRequests) {
      startTime = new Date().getTime()
      reqId = startTime % 1000
      log.debug(config.requestPrefix + "["+reqId+"] " + request.path)
    }
    return request;
  },

  /*
  response: function (response, config, meta) {
    if (config.logResponses) {
      log.debug("RESPONSE")
      log.debug(response)
    }
    log.debug("RESPONSE")
    return response;
  },
  */

  success: function (response, config, meta) {
    if (config.logResponses) {
      var duration = new Date().getTime() - startTime
      if (config.logPayload) {
        log.debug(config.responsePrefix + "["+reqId+"]", response.status.code, "in "+duration+" ms ", response.entity ? response.entity : "[empty response]")
      } else {
        log.debug(config.responsePrefix + "["+reqId+"]", response.status.code, "in "+duration+" ms")
      }
      /*   doesn't work becasue response.entity is not yet filled   RACE CONDITION
      var responseAsStr = JSON.stringify(response.entity)
      console.log("response.entity '"+response.entity+"'")
      console.log("responseAsStr", responseAsStr, JSON.stringify(response.entity))
      var abreviated = (responseAsStr.length > config.maxPayloadLength) ? " [...]" : ""
      log.debug(responseAsStr.substr(0, config.maxPayloadLength) + abreviated)
      */
    }
    return response;
  },

  error: function (response, config, meta) {
  	
    if (config.logErrors) {
      log.error(config.responsePrefix + "["+reqId+"]" + " ERROR in response: " + JSON.stringify(response))
    }
    return response;
  }

});

