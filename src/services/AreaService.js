/**
 * UserService handles all CRUD and search operations for "areas".
 */
"use strict"

var BaseRestClient = require ('./BaseRestClient')

var areaSchmea = {
  id: "/Area",
  type: "object",
  properties: {
    title: { type: "string", required: true },
    description: { type: "string", required: true }
  }
}

var options = {
  modelName: 'Area',
  url: 'https://api.mlab.com/api/1/databases/liquido-test/collections/areas/${id}',
  urlParams: { apiKey: '1crkrQWik4p98uPiOzZiFG0Fkya0iNiU' },
  jsonSchema: areaSchmea
}

class AreaService extends BaseRestClient {
  // Empty
}

module.exports = AreaService.getInstance(options)