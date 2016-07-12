/**
 * Main entry class for Liquido
 * 
 * Here we initialize Vue, setup our URL-routing and register global Vue components.
 */
import Vue from 'vue'
import VueRouter from 'vue-router'
import VueResource from 'vue-resource'

// Vue components
//TODO: import Login from './components/Login'   see: https://auth0.com/blog/2015/11/13/build-an-app-with-vuejs/
import LiquidoHeader from './components/LiquidoHeader'
import LiquidoHome from './components/LiquidoHome'
import EditableCell from './components/EditableCell'
import Ideas from './components/Ideas'

Vue.use(VueResource);
Vue.use(VueRouter)

// Register custom components
Vue.component('liquido-header', LiquidoHeader)
Vue.component('editable-cell', EditableCell)
//Vue.component('data-table', DataTable)   // not used anymore, replaced with vue-tables

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
        component: Ideas
    },
    '/userHome': {
        component: function(resolve) {    // asyncronously require component for lazy loading
          require(['./components/UserHome.vue'], resolve)
        }
    }
})

// Start Vue app
router.start(App, '#app')
