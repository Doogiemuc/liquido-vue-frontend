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
import loglevel from 'loglevel'

var log = loglevel.getLogger('main.js');

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


// ==============================================================================
// Here we actually start the app. 
// A lot of things are happening here
//
// First we make a dummy request to the backend to check whether it's there at all. If not we show an error.
// IF we are in development mode, then we load the first user by default and log him in.
// Then we actually start the vue-router RootApp.vue which will replace the content of index.html 
// (the loading spinner) and will show a header and page content.
// ==============================================================================


// Starts the RootApp via vue-router
var startApp = function() {
  router.start(RootApp, '#app', function() {
    if (currentUser) { 
      console.debug("DEVELOPMENT: automatically logged in user: "+currentUser.email)
      router.app.currentUser = currentUser  // This is available in components as this.$root.currentUser
    }
    //console.log("RootApp.vue has started,")
    //TODO: router.app.cacheWarmup()
  })
}

// Performs automatic login. This MUST be done BEFORE the RootApp is started, because many components need this.
var currentUser = null;
var loadDefaultUser = function() {
  RestClient.setLogin("testuser0@liquido.de", "dummyPasswordHash")
  return RestClient.usersCollection.get('1').then(response => {
    currentUser = response.body().data()   // I need to store this is a temporary variable, because RootApp is not instantiated yet here.
    RestClient.setLogin(currentUser.email, "dummyPasswordHash")
    log.debug("Loaded default user "+currentUser.email)
  })
  .catch(err => {
    $('#loadingCircle').replaceWith('<p class="bg-danger">ERROR: Cannot load default user.</p>')
  })
}

RestClient.ping.get()
.then(() => {
  console.log("Backend is alive at "+RestClient.ping.url())
  // When we are in development environment, we prepare some special things
  if (process.env.NODE_ENV == "development") {
    log.setLevel("trace")  // trace == log everything
    loadDefaultUser().then(startApp)
  } else {
    log.setLevel("info")
    startApp()
  }
})
.catch(err => {
  console.error("FATAL ERROR: Backend is not available at "+process.env.backendBaseURL, err)
  $('#loadingCircle').replaceWith('<p class="bg-danger">ERROR: Backend is not available! Please try again later.</p>')
})






