/*global jasmine*/
var _ = require('lodash')

beforeEach(function () {

  jasmine.addMatchers({
    toBeArray: function() {
      return {
        compare: function(actual, expected) {
          return {
            pass: _.isArray(actual)
          }
        }
      }
    },
    toHaveLength: function() {
      return {
        compare: function(actual, expected) {
          return {
            pass: _.isArray(actual) && actual.length == expected,
            message: "Expected Array to have length "+expected
          }
        }
      }
    }
    
  });
});
