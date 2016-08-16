/**
 * Main entry class for Liquido
 * 
 * Here we initialize Vue, setup our URL-routing and register global Vue components.
 */
import Vue from 'vue'
import VueRouter from 'vue-router'
import VueResource from 'vue-resource'
import LiquidoHome from './controllers/LiquidoHome'

// Register custom components
Vue.component('liquido-header', require('./components/LiquidoHeader'))

// Vue plugins
Vue.use(VueResource);
Vue.use(VueRouter)
//TODO: Vue.use(require('vue-model'))

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


// Start Vue app

var userService = require('./services/UserService.js')

router.start(App, '#app', function() {
  console.log("App is started.") 
  userService.getAll({l:1}).then((users)=> {
    console.log("currentUser: "+users[0].email)
    router.$currentUser = users[0]
  })
  
})

