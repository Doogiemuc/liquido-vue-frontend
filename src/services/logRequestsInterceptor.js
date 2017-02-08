/**
 * CuCoJS REST Client interceptor that can output a log of log information
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
    config.logErrors    = config.logErrors    || true
    config.logRequests  = config.logRequests  || true
    config.logResponses = config.logResponses || true
    config.logPayload   = config.logPayload   || true
    return config;
  },

  request: function (request, config, meta) {
    if (config.logRequests) {
      startTime = new Date().getTime()
      reqId = startTime % 1000
      log.debug("=> Request["+reqId+"]", request)
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
      log.debug("<= Response["+reqId+"]", response, "in "+duration+" ms")
      if (config.logPayload && response.entity) 
        log.debug(JSON.stringify(response.entity))
    }
    return response;
  },

  error: function (response, config, meta) {
    if (config.logErrors) {
      log.error("   ERROR", response)
    }
    return response;
  }

});

