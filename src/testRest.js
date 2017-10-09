var rest = require('rest');
var interceptor = require('rest/interceptor');


var noopInterceptor = interceptor({
    init: function (config) {
        // do stuff with the config
        return config;
    },
    request: function (request, config, meta) {
        // do stuff with the request
        return request;
    },
    response: function (response, config, meta) {
        // do stuff with the response
        return response;
    },
    success: function (response, config, meta) {
        // do stuff with the response
        return response;
    },
    error: function (response, config, meta) {
        // do stuff with the response
        return Promise.reject(response);
    }
    
});


var client = rest.wrap(noopInterceptor)

console.log("sendnig request with client")
client('http://unknown:1234/').then(function(response) {
  console.log('Response: ', response);
})
.catch(function (err) {
  console.log("Catch ERROR ", err)
})