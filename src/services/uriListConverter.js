/**
 * MIME type interceptor for our REST client that can handle 
 * Content-type: "text/uri"
 */
import registry from 'rest/mime/registry'

var uriListConverter = {
	read: function (str, opts) {
	  return str;  //MAYBE convert to a array
	},
	write: function (obj, opts) {
	  return obj.toString();
	}
}

registry.register('text/uri-list', uriListConverter);