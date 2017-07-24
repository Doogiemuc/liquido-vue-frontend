var request = require("request");

var options = { method: 'GET',
  url: 'http://localhost:8080/liquido/v2/_ping',
  headers: 
   { 'postman-token': 'bcb55d4f-3af5-fbc5-c060-227ad0ca0b63',
     'cache-control': 'no-cache',
     authorization: 'Basic dGVzdHVzZXIwQGxpcXVpZG8uZGU6ZHVtbXlQYXNzd29yZEhhc2g=' } };

request(options, function (error, response, body) {
  if (error) throw new Error(error);

  console.log(body);
});
