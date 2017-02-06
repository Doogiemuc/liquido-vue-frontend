/**
 * Main entry class for Liquido
 *
 * Here we initialize Vue, setup our URL-routing and register global Vue components.
 */
import Vue from 'vue'
import VueRouter from 'vue-router'
//import VueForm from 'vue-form'                    // https://github.com/fergaldoyle/vue-form    Vue Form Validation  //TODO: not yet working with  Vue2 !!!
import RootApp from './controllers/RootApp'
import LiquidoHome from './controllers/LiquidoHome'
import apiClient from './services/LiquidoApiClient'
import loglevel from 'loglevel'
var log = loglevel.getLogger('main.js');

// Vue plugins
Vue.use(VueRouter)
//Vue.use(VueForm)

// Setup Vue-router for navigation
const routes = [
  { 
    path: '/', 
    component: LiquidoHome 
  },
  // asyncronously require components for lazy loading, WebPack code split point
  { path: '/login', 
    component: function(resolve) {
      require(['./controllers/LoginPage.vue'], resolve)
    }
  },
  { path: '/areas',
    component: function(resolve) {
      require(['./controllers/AreasPage.vue'], resolve)
    }
  },
  { path: '/ideas', 
    component: function(resolve) {
      require(['./controllers/IdeasPage.vue'], resolve)
    }
  },
  { path: '/editIdea',  // optional url parameter ...?ideaId=42.  Without it a new idea can be created
    component: function(resolve) {
      require(['./controllers/EditIdea.vue'], resolve)
    }
  },
  { path: '/userHome',
    component: function(resolve) {
      require(['./controllers/UserHome.vue'], resolve)
    }
  },
  { path: '/proxies',
    component: function(resolve) {
      require(['./controllers/Proxies.vue'], resolve)
    }
  },
  { path: '/editProxy',   // ?areaId=42
    component: function(resolve) {
      require(['./controllers/ProxyEdit.vue'], resolve)
    }
  }
]

const router = new VueRouter({routes})

// ==============================================================================
// Here we actually start the app. 
// A lot of things are happening here
//
// First we make a dummy request to the backend to check whether it's there at all. If not we show an error.
// IF we are in development mode, then we load the first user by default and log him in.
// Then we actually start the vue-router RootApp.vue which will replace the content of index.html 
// (the loading spinner) and will show a header and page content.
// ==============================================================================

var isBackendAlive = function() {
  return apiClient.ping()
  .then(() => {
    log.debug("Backend is alive at "+process.env.backendBaseURL)
  })  
  .catch(err => {
    console.error("FATAL ERROR: Backend is not available at "+process.env.backendBaseURL, err)
    $('#loadingCircle').replaceWith('<p class="bg-danger">ERROR: Backend is not available! Please try again later.</p>')
    return Promsie.reject()
  })
}

var currentUser = undefined
var checkDevelopmentMode = function() {
  if (process.env.NODE_ENV == "development") {
    loglevel.setLevel("trace")                              // trace == log everything
    var userEmail = "testuser0@liquido.de"                  // email of user that will automatically be logged in
    apiClient.setLogin(userEmail, "dummyPasswordHash")      // need authorisation to make any calls at all  
    return apiClient.findUserByEmail(userEmail).then(user => {
      currentUser = user  
      log.debug("DEVELOPMENT: auto login", user)
    })
  } else {
    return Promise.resolve()
  }
}

var startApp = function() {
  console.log("currentUser.email=", currentUser.email)

  const rootVue = new Vue({
    router,
    el: '#app',
    data: {
      currentUser: currentUser,   // currently logged in user information
      api: apiClient              // singleton instance, available to all (sub)components as "this.$root.api"
    },
    render: h => h(RootApp)       // https://vuejs.org/v2/guide/installation.html#Standalone-vs-Runtime-only-Build
  })

  console.log("Liquido web app has started.")
  //TODO: router.app.cacheWarmup()
}

isBackendAlive()
  .then(checkDevelopmentMode)
  .then(startApp)
  .catch(err => {
    console.error("Error during startup", err)
    $('#loadingCircle').replaceWith('<p class="bg-danger">ERROR: Cannot load Liquido App. Please try again later.</p>')
  })






