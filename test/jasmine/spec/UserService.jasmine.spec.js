/**
 * Smoke tests for UserService
 *
 * These tests will run with jasmin as plain node javascript - no browser involved
 * So you cannot test any real HTML DOM frontend here. But you can do unit tests of backend services very quickly.
 */
"user strict"
/*global expect, fail*/

/*
var handleError = function(err) {
  console.error("ERROR in test", err)
  fail(err)
}
*/
describe("UserService", function() {
  var userService = require('../../../src/services/UserService')

  /**
   * Each test will get its own freshly new IdeaService instance (with a clean cache).
   * Tests must be indipendant of each other!
   */
  beforeEach(function() {
    userService.cache = {}
  });


  it('should validate a user', function(done) {
    var params = { l: 1 }
    userService.getAll(params).then(function(users) {
      var user = {
        "email" : "testuser0@liquido.de",
        "passwordHash" : "$2a$10$PHWR6leSZg01IC30g0aEj.8XXXXa7KcMhHz9wSOzqxdlTSI87gx26",
        "profile" : {
                "name" : "Test User0",
                "website" : 'web',
                "picture" : "http://www.avatar.org/img0.png"
        },
        "createdAt" : { $date: "2016-07-20T06:16:59.791Z" },
        "updatedAt" : { $date: "2016-07-21T06:16:59.791Z" }
      }
      var valid = userService.validate(user)
      expect(valid).toBeTruthy("User should have been valid.")
      done()
    })
  })

  it('validation should fail for invalid user data', function() {
    var invalidUser = { emailFooBar: 'fooBar' }
    var valid = userService.validate(invalidUser)
    expect(valid).toBeFalsy("This user data should have been invalid.")
  })
  
})
