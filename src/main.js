/**
 * Main entry class for Liquido
 *
 * Here we initialize Vue, setup our URL-routing and register global Vue components.
 */
 
import Vue from 'vue'
import VueRouter from 'vue-router'
import RootApp from './pages/RootApp'
import LiquidoHome from './pages/LiquidoHome'
import apiClient from './services/LiquidoApiClient'
import loglevel from 'loglevel'
var log = loglevel.getLogger('main.js')

// Vue plugins
Vue.use(VueRouter)

// ================= Setup Vue-router for navigation =============

//MAYBE: With named routes https://router.vuejs.org/en/essentials/named-routes.html
//       I could abstract away from the client URL pathes one level more. But is that necessary?
const routes = [
  { 
    path: '/', 
    component: LiquidoHome 
  },
  // asyncronously require components for lazy loading, WebPack code split point
  { path: '/login', 
    component: function(resolve) {
      require(['./pages/LoginPage.vue'], resolve)
    }
  },
  { path: '/categories',
    component: function(resolve) {
      require(['./pages/Categories_List.vue'], resolve)
    }
  },
  /*  TODO: editCategory
  { path: '/editCategory',  // optional url parameter ...?categoryId=...  Without it a new category can be created
    component: function(resolve) {
      require(['./pages/EditCategory.vue'], resolve)
    }
  }
  */
  // ======================= Idea =======================
  { path: '/ideas', 
    component: function(resolve) {
      require(['./pages/Ideas_List.vue'], resolve)
    }
  },
  { path: '/addIdea',   // add a new idea
    component: function(resolve) {
      require(['./pages/Idea_Edit.vue'], resolve)
    },
    props: { ideaId: undefined }
  },
  { path: '/idea/:ideaId',  // show one idea. ideaID is the numerical ID of this idea. Can be edited by its creator only.
    component: function(resolve) {
      require(['./pages/Idea_Edit.vue'], resolve)
    },
    props: true
  },
  // ======================= Proposals =======================
  { path: '/proposals', 
    component: function(resolve) {
      require(['./pages/Proposals_List.vue'], resolve)
    }
  },
  { path: '/proposal/:proposalId',  // show one proposal
    component: function(resolve) {
      require(['./pages/Proposal_Show.vue'], resolve)
    },
    props: true 
  },
  // ======================= Laws =======================
	/*
  { path: '/laws', 
    component: function(resolve) {
      require(['./pages/Laws_List.vue'], resolve)
    }
  },
	*/
  // ======================= User Home =======================
  { path: '/userHome',
    component: function(resolve) {
      require(['./pages/UserHome.vue'], resolve)
    }
  },
  // ======================= Proxies =======================
  { path: '/proxies',
    component: function(resolve) {
      require(['./pages/Proxies.vue'], resolve)
    }
  },
  { path: '/editProxy',   // ?categoryId=42
    component: function(resolve) {
      require(['./pages/Proxy_Edit.vue'], resolve)
    }
  },
  // ======================= Polls =======================
  { path: '/polls', 
    component: function(resolve) {
      require(['./pages/Polls_List.vue'], resolve)
    }
  },
	{ path: '/polls/:pollId',
    component: function(resolve) {
      require(['./pages/Poll_Show.vue'], resolve)
    },
		props: true  // pass URL parameter to prop in component
  },  
  { path: '/castVote/:pollId',
    component: function(resolve) {
      require(['./pages/Poll_CastVote.vue'], resolve)
    },
    props: true 
  },
  /*
  { path: '/createPoll',
    component: function(resolve) {
      require(['./pages/createPoll.vue'], resolve)
    }
  },
  */
  { path: '*', 
    component: function(resolve) {
      require(['./pages/PageNotFound.vue'], resolve)
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
    return Promise.resolve("Backend is ok")
  })
  .catch(err => {
    var errorMsg = "FATAL ERROR: Backend is NOT available at "+process.env.backendBaseURL + ": "+err 
    console.error(errorMsg)
    $('#loadingCircle').replaceWith('<p class="bg-danger">ERROR: Backend is not available! Please try again later.</p>')
    return Promise.reject(errorMsg)
  })
}

var currentUser = undefined

var checkDevelopmentMode = function() {
  if (process.env.NODE_ENV == "development") {
    log.info("Running in development mode. Increase log level and automatically log in a default user.")
    loglevel.setLevel("trace")                              // trace == log everything
    var userEmail = "testuser0@liquido.de"                  // email of user that will automatically be logged in
    apiClient.login(userEmail, "dummyPasswordHash")         // need authorisation to make any calls at all  
    return apiClient.findUserByEmail(userEmail).then(user => { 
      currentUser = user  
    })
  } else {
    return Promise.resolve() 
  }
}

var startApp = function(props) {
  log.debug("Starting Vue app (with currentUser.email="+currentUser.email+" and props=", props)

  const rootVue = new Vue({
    el: '#app',
    router,
    data: {
      api: apiClient,                       // API client for Liquido Backend available to all Vue compents as this.$root.api
      props: props,                         // application wide properties (read from backend DB)
      currentUser: currentUser,             // currently logged in user information
      currentUserURI: currentUser._links.self.href   // URI of the currently logged in user, e.g. http://localhost:8080/liquido/v2/users/1
    },
    ...RootApp
  }).$mount()

  log.info("===== Liquido web app has started.")
  //TODO: router.app.cacheWarmup()
}

//JS Promises at its best :-)

isBackendAlive()
  .then(checkDevelopmentMode)
  .then(apiClient.fetchGlobalProperties)
  .then(startApp)
  .catch(err => {
    console.error("Error during startup", err)
    $('#loadingCircle').replaceWith('<p class="bg-danger">ERROR while loading Liquido App. Please try again later.</p>')
  })






