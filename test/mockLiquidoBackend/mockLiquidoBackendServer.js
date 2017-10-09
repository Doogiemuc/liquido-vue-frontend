/**
 * Mocked liquido backend
 * This is a very simply HTTP server, that accepts REST requests
 * and responses with (mostly) static data ("test fixtures")
 *
 * This mock backend is used from the jasmine unit tests.
 */

var http = require('http')
var	fs = require('fs');
var loglevel = require("loglevel")
var log = loglevel.getLogger("MockLiquidoBackend");

var httpServer = null;

// Start an HTTP server
exports.startHttpServer = function() {
	httpServer = http.createServer(function (req, res) {
		log.debug("=> MockLiquidoBackend: "+req.method+" "+req.url);
		RouteManager.findRoute(req,res);
	});
	httpServer.on('error',function(err){
		console.error('Mock backend: Error starting http server',err);
	});
	httpServer.listen(4444);
  log.info('Mock backend: Http server Listening on port ' + 4444);

};

exports.stopHttpServer = function() {
	httpServer.close();
	log.debug("Mock backend: http server stopped.")
}

var apiBasePath = '/liquido/v2'

var RouteManager ={
	"findRoute":function(req,res){
		var handler
		for(var route in this.routes) {
			if (new RegExp(route).test(req.url)) {
				handler = this.routes[route];
				break;
			}
		}
    if (!handler) {
    	console.warn("404: not  found " + req.url)
    	res.writeHead(404);
			res.end();
    } else {
			handler.call(this,req,res);
    }
	},
	// regular expression matching for dummy URL routes
	"routes": {
		// main.js => isAlive
		[apiBasePath+'/_ping']: function(req, res) {
			log.debug("<= _ping")
			res.writeHead(200, {'Content-Type': 'text/plain'});
			res.end("{\"Hello\":\"World\"}");
		},
	  // DelegationService.jasmine.spec.js   getNumVotes  => always return 5  for any userId and areaId
	  '/users/[a-f0-9]{24}/getNumVotes\\?areaId=[a-f0-9]{24}': function(req, res) {
	  	var message = '5';
	  	log.debug("<= MockLiquidoBackend: "+message)
			res.writeHead(200, {'Content-Type': 'text/plain'});
			res.end('5');
	  },
    
    '/laws/search/reachedQuorumSince\\?since=': function(req, res) {
      var fileData = 'test/testData/reachedQuorumSince.json'
	  	var responseJson = fs.readFileSync(fileData, 'utf8');
	  	log.debug("<= MockLiquidoBackend: "+fileData)
			res.writeHead(200, {'Content-Type': 'application/json'})
			res.write(responseJson)
      res.end()
	  },
    
	  /*
		"/json":function(req,res){
			//this.sleep(5000);
			var message = fs.readFileSync('./message.json','utf8');
			res.writeHead(200, {'Content-Type': 'application/json'});
			res.write(message.toString());
			res.end();
		},
		"/xml":function(req,res){
			var message = fs.readFileSync('./message.xml','utf8');
			res.writeHead(200, {'Content-Type': 'application/xml'});
			res.write(message.toString());
			res.end();
		},
		"/120/json?arg1=hello&arg2=world":function(req,res){
				if (!req.headers["test-header"]) throw "no test-header found!!";
				res.setHeader("test-response-header",req.headers["test-header"]);
				this.routes["/json"](req,res);
		},
		"/json?post":function(req,res){
			req.on('data',function(data){
				console.log("[SERVER] data = ", data);
				res.writeHead(200, {'Content-Type': 'application/json'});
				//res.writeHead(200, {'Content-Type': 'text/plain'});
				res.write(data.toString());
				res.end();
			});

		},
		"/json/empty":function(req,res){
			res.writeHead(204, {'Content-Type': 'application/json'});
			res.end();
		},
		"/xml/empty":function(req,res){
			res.writeHead(204, {'Content-Type': 'application/xml'});
			res.end();
		},
		"/json/contenttypewithspace":function(req,res){
			var message = fs.readFileSync('./message.json','utf8');
			res.writeHead(200, {'Content-Type': 'application/json; charset=utf-8'});
			res.write(message.toString());
			res.end();
		}
		*/
	},
	"sleep":function(ms){

    var stop = new Date().getTime();
    	while(new Date().getTime() < stop + ms) {
      ;
    	}
	}

};
