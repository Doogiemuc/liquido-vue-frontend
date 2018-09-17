var merge = require('webpack-merge')
var prodEnv = require('./prod.env')

/* Keep in mind, that all values in this JSON must be quoted with single AND double quotes, because of webpack !!! */
module.exports = merge(prodEnv, {
  NODE_ENV: '"development"',
  backendBaseURL: '"http://localhost:8080/liquido/v2"',     // URL of HATEOAS rest endpoint in backend (without trailing slash)   MUST be localhost, otherwise you have CORS problems 
	//backendBaseURL: '"http://ec2-34-245-164-48.eu-west-1.compute.amazonaws.com/liquido/v2"',   // backend on AWS EC2  ("PROD")
	autoLoginUser: '""', // '"testuser1@liquido.de"',
	autoLoginPass: '""', //'"dummyPasswordHash"',
})
