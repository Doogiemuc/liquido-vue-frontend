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
import auth from './services/auth'

import loglevel from 'loglevel'
var log = loglevel.getLogger('main.js')

// ================= Setup Vue-router for navigation =============
const routes = [
  { path: '/(liquidoHome)?',
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

  // =================== Category / Area ================
  { path: '/categories',
    component: function(resolve) {                // asyncronously require components for lazy loading, WebPack code split point
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
  { path: '/search',
    name: 'search',
    component: function(resolve) {
      require(['./pages/Search.vue'], resolve)
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
    props: true                 // make URL parameters available as properties in the component
  },
  { path: '/ideas/:ideaId/edit',  // show one idea. ideaID is the numerical ID of this idea. Can be edited by its creator only.
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
  { path: '/proposals/:proposalId',  // show one proposal
    component: function(resolve) {
      require(['./pages/Proposal_Show.vue'], resolve)
    },
    props: true
  },

  // ======================= Laws =======================
  { path: '/laws',
    component: function(resolve) {
      require(['./pages/Laws_List.vue'], resolve)
    }
  },
  { path: '/laws/:lawId',
    component: function(resolve) {
      require(['./pages/Law_Show.vue'], resolve)
    },
    props: true
  },

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
    name: 'showPoll',
    component: function(resolve) {
      require(['./pages/Poll_Show.vue'], resolve)
    },
		props: true
  },
  { path: '/polls/:pollId/sortBallot',
    name: 'sortBallot',
    component: function(resolve) {
      require(['./pages/Poll_SortBallot.vue'], resolve)
    },
    props: true
  },
  { path: '/polls/:pollId/castVote',    // can only be called as named route.
    name: 'castVote',
    component: function(resolve) {
      require(['./pages/Poll_CastVote.vue'], resolve)
    },
    props: true
  },

  // ======================= PageNotFound =======================
  // Show error page for all invalid pathes
  { path: '/pageNotFound', component: PageNotFound, meta: { requiresAuth: false } }

]

Vue.config.productionTip = process.env.NODE_ENV !== 'development'  // turn off productionTip in dev env
Vue.use(VueRouter)
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
  console.log("checking route", auth)
  if (to.matched.length == 0) {
    next({path: '/pageNotFound'})
  } else
  if (requiresAuth(to) && !auth.isLoggedIn) {
    auth.tryLoginFromLocalStorage().then(user => {
      if (user) {
        next()
      } else {
        next({
          path: '/login',
          query: { redirect: to.fullPath }
        })
      }
    })
  } else {
    next()        // make sure to always call next()!
  }
})

//Nice quick short demo for vue-router and auth: https://codepen.io/takatama/pen/zoNeWP

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
    $('#loadingCircle').replaceWith('<div class="alert alert-danger">ERROR: Backend is not available at '+process.env.backendBaseURL+'<br/>Please try again later.</div>')
    return Promise.reject(errorMsg)
  })
}

var checkDevelopmentMode = function() {
  if (process.env.NODE_ENV == "development") {
    log.info("LIQUDIO is running in DEVELOPMENT mode!")
    loglevel.setLevel("trace")   // trace == log everything
    log.debug("process.env", process.env)
  }
  return Promise.resolve()
}

var autoLoginDevUser = function(rootApp) {
  if (process.env.NODE_ENV == "development" && process.env.autoLoginMobilephone !== undefined) {
    auth.devLogin(process.env.autoLoginMobilephone)
  }
  return Promise.resolve()
}

var startApp = function(props) {
  var rootApp = new Vue({
    el: '#app',
    router,
    data: {
      api: apiClient,                       // API client for Liquido Backend available to all Vue compents as this.$root.api
      props: props,                         // application wide properties (read from backend DB)
      auth: auth,
    },
    ...RootApp
  }).$mount()
  log.info("===== LIQUIDO web app has started.")
  return rootApp
}

//Here comes JS Promises at its best :-)
checkDevelopmentMode()
  .then(isBackendAlive)
  .then(apiClient.getGlobalProperties)
  .then(startApp)
  .then(autoLoginDevUser)
  .catch(err => {
    console.error("Fatal rrror during LIQUIDO startup", err)
    $('#loadingCircle').replaceWith('<p class="bg-danger" id="backendNotAlive">ERROR while loading Liquido App. Please try again later.</p>')
  })

