/**
 * Main entry class for Liquido
 *
 * Here we initialize Vue, setup our URL-routing and register global Vue components.
 */

import Vue from 'vue'
import VueRouter from 'vue-router'
import RootApp from './pages/RootApp'
import LiquidoHome from './pages/LiquidoHome'
import RegisterPage from './pages/RegisterPage'
import LoginPage from './pages/LoginPage'
import LogoutPage from './pages/LogoutPage'
import PageNotFound from './pages/PageNotFound'

import apiClient from './services/LiquidoApiClient'
import loglevel from 'loglevel'
var log = loglevel.getLogger('main.js')

// Vue plugins
Vue.use(VueRouter)

// ================= Setup Vue-router for navigation =============
// Some use named routes https://router.vuejs.org/en/essentials/named-routes.html
const routes = [
  { path: '/',
    component: LiquidoHome,
    meta: { requiresAuth: false }
  },
  { path: '/register',
    name: 'register',
    component: RegisterPage,
    meta: { requiresAuth: false }
  },
  { path: '/login',
    name: 'login',
    component: LoginPage,
    meta: { requiresAuth: false },
    props: true
  },
  { path: '/logout',
    component: LogoutPage,
    meta: { requiresAuth: false }
  },

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
  { path: '/ideas/add',
    component: function(resolve) {
      require(['./pages/Idea_Edit.vue'], resolve)
    },
    props: { ideaId: undefined }
  },
  { path: '/ideas/:proposalId',  // show one idea. ideaID is the numerical ID of this idea. Can be edited by its creator only.
    component: function(resolve) {
      require(['./pages/Proposal_Show.vue'], resolve)
    },
    props: true
  },
  // ======================= Proposals =======================
  { path: '/proposals',
    component: function(resolve) {
      require(['./pages/Proposals_List.vue'], resolve)
    }
  },
  { path: '/proposals/:proposalId',  // show one proposal
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
      require(['./pages/Proxies_Show.vue'], resolve)
    }
  },
  { path: '/proxies/:categoryId',
    name: 'editProxy',
    component: function(resolve) {
      require(['./pages/Proxy_Edit.vue'], resolve)
    },
    props: true
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
  { path: '/polls/:pollId/sortBallot',
    component: function(resolve) {
      require(['./pages/Poll_SortBallot.vue'], resolve)
    },
    props: true
  },
  { // this named route also uses the param  "voteOrder": []
    path: '/polls/:pollId/castVote',
    name: 'castVote',
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

/** check if ANY of the matched routes requires authentication */
var requiresAuth = function(to) {
  return to.matched.some(record => {
    return record.meta.requiresAuth !== false
  })
}

/**
 * If route matches nothing => PageNotFound


 * If matched page requiresAuth and not logged in => /login
 * Otherwise next()
 */
router.beforeEach((to, from, next) => {
  if (to.matched.length == 0) {
    next({path: '/pageNotFound'})
  } else
  if (requiresAuth(to) && router.app.$root.currentUser === undefined) {
    next({
       path: '/login',
       query: { redirect: to.fullPath }
     })
  } else {
    next()        // make sure to always call next()!
  }
})

// ==============================================================================
// Here we start the frontend app.
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
    log.info("LIQUDIO is running in DEVELOPMENT mode!")
    loglevel.setLevel("trace")   // trace == log everything
    log.debug("process.env", process.env)
  }
  return Promise.resolve()
}

var startApp = function(props) {
  //console.log("Properties", props)
  const rootVue = new Vue({
    el: '#app',
    router,
    data: {
      api: apiClient,                       // API client for Liquido Backend available to all Vue compents as this.$root.api
      props: props,                         // application wide properties (read from backend DB)
      currentUser: currentUser,             // currently logged in user information, available to all VueJS child components as this.$root.currentUser
    },
    ...RootApp
  }).$mount()

  log.info("===== LIQUIDO web app has started.")
}

//Here comes JS Promises at its best :-)
isBackendAlive()
  .then(checkDevelopmentMode)
  .then(apiClient.getGlobalProperties)
  .then(startApp)
  .catch(err => {
    console.error("Fatal rrror during LIQUIDO startup", err)
    $('#loadingCircle').replaceWith('<p class="bg-danger">ERROR while loading Liquido App. Please try again later.</p>')
  })

