/**
 * MIME type interceptor for our REST client that can handle 
 * Content-type: "text/uri"
 */
var registry = require('rest/mime/registry')

var uriListConverter = {
	read: function (str, opts) {
	  return str;  //MAYBE convert to a array
	},
	write: function (obj, opts) {
	  return obj.toString();
	}
}

registry.register('text/uri-list', uriListConverter);