/**
 * Main entry class for Liquido
 *
 * Here we initialize Vue, setup our URL-routing and register global Vue components.
 */

import Vue from 'vue'
import VueRouter from 'vue-router'
import RootApp from './pages/RootApp'
import LiquidoHome from './pages/LiquidoHome'
import LoginPage from './pages/LoginPage'
import LogoutPage from './pages/LogoutPage'


import PageNotFound from './pages/PageNotFound'

import apiClient from './services/LiquidoApiClient'
import loglevel from 'loglevel'
var log = loglevel.getLogger('main.js')

// Vue plugins
Vue.use(VueRouter)

// ================= Setup Vue-router for navigation =============

//MAYBE: With named routes https://router.vuejs.org/en/essentials/named-routes.html
//       I could abstract away from the client URL pathes one level more. But is that necessary?
const routes = [
  { path: '/',
    component: LiquidoHome,
    meta: { requiresAuth: false }
  },
  { path: '/login',
    component: LoginPage,
    meta: { requiresAuth: false }
  },
  { path: '/logout',    component: LogoutPage },

  // asyncronously require components for lazy loading, WebPack code split point
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

  // Show error page for all invalid pathes
  { path: '/pageNotFound', component: PageNotFound, meta: { requiresAuth: false } }

]

const router = new VueRouter({routes})


/**
 * If route matches nothing => PageNotFound
 * If matched page requiresAuth and not logged in => /login
 * Otherwise next()
 */
router.beforeEach((to, from, next) => {
  console.log("checking path ",to.matched)
  if (to.matched.length == 0) console.log("no match")


  if (to.matched.some(record => {
    //console.log("checking ", record)
    return record.meta.requiresAuth !== false
  }) &&
      router.app.$root.currentUser === undefined)
  {
    console.log("needs login")
    next({
       path: '/login',
       query: { redirect: to.fullPath }
     })
  } else {
    console.log("ok")
    next()        // make sure to always call next()!
  }
})

/*
router.beforeEach((to, from, next) => {
  console.log("checking path ",to.path)
  if (to.path === "/" || to.path === '/login') {
    next();
    return
  }

  Object.keys(routes).forEach(function(key,index) {
    if (routes[key].path.startsWith())
  }

  if (router.app.$root.currentUser === undefined && (to.path !== "/" && to.path !== '/login')) {
    console.log("need login!!")
    //TODO: forward to error page if to.path is not contained in routes.path ?
    next("/login")
  } else {
    console.log("normal navigation")
    next()
  }
})
*/

// ==============================================================================
// Here we start the forontend app. 
// A lot of things are happening here
//
// First we make a dummy request to the backend to check whether it's there at all. If not we show an error.
// IF we are in development mode, then we load the first user by default and log him in.
// Then we start the vue-router RootApp.vue which will replace the content of index.html 
// (the loading spinner) and will show a header and page content.
// ==============================================================================

var isBackendAlive = function() {
  return apiClient.ping()
  .then(() => {
    log.info("Backend is alive at "+process.env.backendBaseURL)
    return Promise.resolve("Backend is ok")
  })
  .catch(err => {
    var errorMsg = "FATAL ERROR: Backend is NOT available at "+process.env.backendBaseURL + ": "+err
    console.error(errorMsg)
    $('#loadingCircle').replaceWith('<p class="bg-danger">ERROR: Backend is not available at '+process.env.backendBaseURL+' !</p><p>Please try again later.</p>')
    return Promise.reject(errorMsg)
  })
}

var currentUser = undefined

var checkDevelopmentMode = function() {
  if (process.env.NODE_ENV == "development") {
    log.info("Running in development mode.")
    loglevel.setLevel("trace")                              // trace == log everything		
  }
  // automatically login a user if values are set
  if (process.env.autoLoginUser && process.env.autoLoginPass) {
    log.info("Automatic login of "+process.env.autoLoginUser)
		apiClient.login(process.env.autoLoginUser, process.env.autoLoginPass)         
		return apiClient.findUserByEmail(process.env.autoLoginUser).then(user => { 
			currentUser = user  
		})
	}
  return Promise.resolve()
}

var startApp = function(props) {
  log.info("Starting Vue app (with currentUser.email="+ (currentUser ? currentUser.email : "<null>") +" and props=", props)

  const rootVue = new Vue({
    el: '#app',
    router,
    data: {
      api: apiClient,                       // API client for Liquido Backend available to all Vue compents as this.$root.api
      props: props,                         // application wide properties (read from backend DB)
      currentUser: currentUser,             // currently logged in user information, available to all VueJS child components as this.$root.currentUser
      currentUserURI: currentUser ? currentUser._links.self.href : undefined   // URI of the currently logged in user, e.g. http://localhost:8080/liquido/v2/users/1
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






