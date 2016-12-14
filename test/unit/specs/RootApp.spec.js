/**
 * Mocha unit tests for RootApp.vue (and also for BaseRestClient)
 * This test cases will run inside PhantomJS, a headleas browser.
 */

/* global expect */

var Vue = require('vue')
var RootApp = require('src/controllers/RootApp.vue')
var log = require("loglevel").getLogger("RootApp.spec");

//if (process.env.NODE_ENV == 'testing') {
//  log.debug("================ SETTING LOG LEVEL in RootApp.spec.js")
//  log.setLevel("trace")  // trace == log everything
//}

describe('RootApp.vue', () => {
  //You can run a single KARMAA test case with   it.only(...)

  // MochaJS "before all hock": this runs once before all tests in this block (should be called beforeAll :-)
  before(function() {
    //this.timeout(5000)
  })

  it('fetch all areas', () => {
    //console.log("====== rootApp=",rootApp)
    var vm = new Vue({         //TODO: according to the docs this should be:  v-ref:root-app-ref
      template: '<div><root-app v-ref="RootAppRef"></root-app></div>',
      components: {
        'root-app': RootApp
      }
    }).$mount()
    return vm.$refs.RootAppRef.fetchAllAreas().then(allAreas => {
      expect(allAreas.length).toBeGreaterThan(4)
      expect(allAreas[0].title).toBeContain("Area 0")
    })
  })


})
