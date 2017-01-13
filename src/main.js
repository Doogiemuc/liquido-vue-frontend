/**
 * Main entry class for Liquido
 *
 * Here we initialize Vue, setup our URL-routing and register global Vue components.
 */
import Vue from 'vue'
import VueRouter from 'vue-router'
import VueForm from 'vue-form'                    // https://github.com/fergaldoyle/vue-form    Vue Form Validation  //TODO: not yet working with  Vue2 !!!
import RootApp from './controllers/RootApp'
import LiquidoHome from './controllers/LiquidoHome'
import LiquidoHeader from './components/LiquidoHeader'
import RestClient from './services/RestClient'

//TODO: import Login from './components/Login'   see: https://auth0.com/blog/2015/11/13/build-an-app-with-vuejs/

// Register global components: <liquido-header> is used in index.html / RootApp.vue
Vue.component('liquido-header', LiquidoHeader)

// Vue plugins
Vue.use(VueRouter)
Vue.use(VueForm)

import tinymceDirective from './components/TinyMceDirective.vue'
Vue.directive('tinymce', tinymceDirective);

// Setup Vue-router for navigation
var router = new VueRouter()
router.map({
  '/': {
    component: LiquidoHome
  },
  '/login': {
    component: function(resolve) {
      require(['./controllers/LoginPage.vue'], resolve)
    }
  },
  // asyncronously require components for lazy loading
  '/ideas': {
    component: function(resolve) {
      require(['./controllers/Ideas.vue'], resolve)
    }
  },
  '/createNewIdea': {
    component: function(resolve) {
      require(['./controllers/CreateNewIdea.vue'], resolve)
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


var currentUser = null;

// Start the RootApp via vue-router
var startApp = function() {
  router.start(RootApp, '#app', function() {
    /*
    if (currentUser) { 
      console.debug("DEVELOPMENT: automatically logged in user: "+currentUser.email)
      router.app.currentUser = currentUser  // This is available in components as this.$root.currentUser
    }
    */
    //console.log("RootApp.vue has started,")
    //TODO: router.app.cacheWarmup()
  })
}

// When we are in development environment, we prepare some special things
if (process.env.NODE_ENV == "development") {
  // Full logging when developming
  var log = require("loglevel")
  log.setLevel("trace")  // trace == log everything
  //log.getLogger("DelegationService").setLevel("TRACE");  // configure per file/module logging

  //perform automatic login. This MUST be done BEFORE the RootApp is started, because many components need this.
  RestClient.usersCollection.get('1').then(response => {
    currentUser = response.body().data()   // I need to store this is a temporary variable, because RootApp is not instantiated yet here.
  })
  .then(startApp)
}
else
{
  startApp()
}

