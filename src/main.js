/**
 * Main entry class for Liquido
 *
 * Here we initialize Vue, setup our URL-routing and register global Vue components.
 */
import Vue from 'vue'
import VueRouter from 'vue-router'
import VueResource from 'vue-resource'
import LiquidoHome from './controllers/LiquidoHome'

// Register custom components: <liquido-header> is used in index.html
Vue.component('liquido-header', require('./components/LiquidoHeader'))

// Vue plugins
Vue.use(VueResource);
Vue.use(VueRouter)

// Vue components
//TODO: import Login from './components/Login'   see: https://auth0.com/blog/2015/11/13/build-an-app-with-vuejs/

// Setup Vue-router for navigation
var App = Vue.extend({})    // Keep in mind that 'App' is _not_ a Vue instance, but a Vue component!

var router = new VueRouter()
router.map({
  '/': {
    component: LiquidoHome
  },
  /*
  '/login': {
    component: Login
  }
  */
  '/ideas': {
    component: function(resolve) {
      //console.log("async loadin Ideas.vue")
      require(['./controllers/Ideas.vue'], resolve)
    }
  },
  '/userHome': {
    component: function(resolve) {    // asyncronously require component for lazy loading
      require(['./controllers/UserHome.vue'], resolve)
    }
  },
  '/proxies': {
    component: function(resolve) {    // asyncronously require component for lazy loading
      require(['./controllers/Proxies.vue'], resolve)
    }
  }
})


var startApp = function() {
  router.start(App, '#app', function() {
    console.log("Vue App is started.")
  })
}

// Full logging when developming
if (process.env.NODE_ENV == "development") {
  console.log("DEVELOPMENT: perform automatic login")
  var log = require("loglevel")
  log.setLevel("trace")  // trace == log everything
  //log.getLogger("DelegationService").setLevel("TRACE");  // configure per file/module logging

  var userService = require('./services/UserService.js')
  userService.getAll({l:1}).then((users)=> {
    console.debug("currentUser: "+users[0].email)
    router.$currentUser = users[0]
  }).then(startApp)
}
else
{
  startApp()
}

