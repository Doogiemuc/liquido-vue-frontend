/**
 * Main entry class for Liquido
 *
 * Here we initialize Vue, setup our URL-routing and register global Vue components.
 */
import Vue from 'vue'
import VueRouter from 'vue-router'
import VueResource from 'vue-resource'
import RootApp from './controllers/RootApp'
import LiquidoHome from './controllers/LiquidoHome'
import LiquidoHeader from './components/LiquidoHeader'
//TODO: import Login from './components/Login'   see: https://auth0.com/blog/2015/11/13/build-an-app-with-vuejs/

// Register global components: <liquido-header> is used in index.html / RootApp.vue
Vue.component('liquido-header', LiquidoHeader)

// Vue plugins
Vue.use(VueResource);
Vue.use(VueRouter)

// Setup Vue-router for navigation
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
  // asyncronously require components for lazy loading
  '/ideas': {
    component: function(resolve) {
      require(['./controllers/Ideas.vue'], resolve)
    }
  },
  '/userHome': {
    component: function(resolve) {
      require(['./controllers/UserHome.vue'], resolve)
    }
  },
  '/proxies': {
    component: function(resolve) {
      require(['./controllers/Proxies.vue'], resolve)
    }
  },
  '/editProxy': {   // ?areaId=33be442...
    component: function(resolve) {
      require(['./controllers/ProxyEdit.vue'], resolve)
    }
  }
})




// Start the RootApp via vue-router
var startApp = function() {
  router.start(RootApp, '#app', function() {
    console.log("=== RootApp.vue is started.")
    //TODO: router.app.cacheWarmup()
  })
}


if (process.env.NODE_ENV == "development") {
  // Full logging when developming
  var log = require("loglevel")
  log.setLevel("trace")  // trace == log everything
  //log.getLogger("DelegationService").setLevel("TRACE");  // configure per file/module logging

  /*
  //perform automatic login. This MUST be done BEFORE the RootApp is started.
  var userService = require('./services/UserService.js')
  userService.getAll({l:1}).then((users)=> {
    RootApp.currentUserId = userService.getId(users[0])
    console.debug("DEVELOPMENT: automatically logged in user: "+users[0].email)
  })
  .then(startApp)
  */
  startApp()
}
else
{
  startApp()
}

