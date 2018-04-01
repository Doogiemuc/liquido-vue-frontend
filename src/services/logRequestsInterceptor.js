/**
 * CuCoJS REST Client interceptor that log HTTP requests and responses with all details. (use for debugging)
 *
 * Usage: 
 *   import rest from 'rest'
 *   import logRequestsInterceptor from './logRequestsInterceptor' 
 *   var client = rest.wrap(logRequestsInterceptor)
 */

import loglevel from 'loglevel'
// import MD5 from 'crypto-js/md5'
var log = loglevel.getLogger("logRequestsInterceptor");
var interceptor = require('rest/interceptor');

var reqId = ""
var startTime = 0

// One disatvantage of this central interceptor is that the Chrome developer console will always show this class
// as the source of the log output. The interesting information would be the calling funciton(s).
// But this can be shown in Chrome, when you replace the log.debug() calls with log.trace() calls which 
// shows the full callstack in Chrome developer console.

// MAYBE: https://github.com/stacktracejs/stacktrace.js

var hashStr = function(str) {
  var hash = 0, i, chr;
  if (str.length === 0) return hash;
  for (i = 0; i < str.length; i++) {
    chr   = str.charCodeAt(i);
    hash  = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};



export default interceptor({
  
  init: function (config) {
    config.requestPrefix  = config.requestPrefix  || '=> '
    config.responsePrefix = config.responsePrefix  || '<= '
    config.logErrors      = config.logErrors    || true
    config.logRequests    = config.logRequests  || true
    config.logResponses   = config.logResponses || true
    config.logPayload     = config.logPayload   || false
    config.maxPayloadLength = config.maxPayloadLength || 400
    return config;
  },

  request: function (request, config, meta) {
    if (config.logRequests) {
      this.startTime = new Date().getTime()
      this.reqId = (hashStr(request.path) * this.startTime) % 10000
      log.debug(config.requestPrefix + "[" + this.reqId + "]", request.path)
    }
    return request
  },

  /* This would be called for successfull AND error responses 
  response: function (response, config, meta) {
    log.debug("RESPONSE")
    if (config.logResponses) {
      log.debug(response)
    }
    return response;
  },
  */

  success: function (response, config, meta) {
    if (config.logResponses) {
      //var  reqId = MD5(response.request.path)
      var duration = new Date().getTime() - this.startTime
      if (config.logPayload) {
        log.debug(config.responsePrefix + "["+this.reqId+"]", response.url, response.status.code, "in "+duration+" ms", response.fromLocalCache ? "from cache" : "", response.entity ? response.entity : "[empty response]")
      } else {
        log.debug(config.responsePrefix + "["+this.reqId+"]", response.url, response.status.code, "in "+duration+" ms", response.fromLocalCache ? "from cache" : "")
      }
    }
    return response
  },

  /**
   * Log errors to the console (if configured)
   * Keep ind mind that there also might be errors during the request phase already, e.g. connection errors.
   */
  error: function (response, config, meta) {
    if (!config.logErrors) return Promise.reject(response)
    if (response.error) {
      log.error(config.requestPrefix + "["+this.reqId+"] request ERROR ", response.error.code, JSON.stringify(response))
    } else if (response.status) {
      log.error(config.responsePrefix + "["+this.reqId+"] response ERROR ", response.status.code, JSON.stringify(response))
    } else {
      log.error(config.responsePrefix + "["+this.reqId+"] response ERROR ", JSON.stringify(response))
    }
    return Promise.reject(response)  // BUGFIX: An interceptor must return a rejected promise to keep the state of error
  }

})

