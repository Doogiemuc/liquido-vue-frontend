// CuCoJS REST Client interceptor that logs all HTTP errors

var interceptor = require('rest/interceptor');

var logErrorInterceptor = interceptor({
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
        //console.log("========== SUCCESS ", JSON.stringify(response, ' ', 2))
        return response;
    },
    error: function (response, config, meta) {
        console.log("HTTP ERROR", response)
        if (response.status && response.status.code >= 400) {
            return Promise.reject(response);
        }
        return response;
    }
});

export default logErrorInterceptor
