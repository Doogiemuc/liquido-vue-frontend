/**
 * Main entry class for Liquido
 * 
 * Here we initialize Vue, setup our URL-routing and connect to the mongoDB backend.
 */
import Vue from 'vue'
import LiquidoHeader from './components/LiquidoHeader'
import DataTable from './components/DataTable'
import LiquidoHome from './components/LiquidoHome'
import Ideas from './components/Ideas'

// register custom components
Vue.component('liquido-header', LiquidoHeader)
Vue.component('data-table', DataTable)

// Vue-resource for making HTTP requests
var VueResource = require('vue-resource');
Vue.use(VueResource);

// Vue-router for navigation
var VueRouter = require("vue-router")
Vue.use(VueRouter)
var App = Vue.extend({})                  // App is our main vue component. (Keep in mind that 'App' is _not_ a Vue instance, but a Vue component!)
var router = new VueRouter()
router.map({
    '/': {
        component: LiquidoHome
    },
    '/ideas': {
        component: Ideas
    },
    '/userHome': {
        component: function(resolve) {    // asyncronously require component for lazy loading
          require(['./components/UserHome.vue'], resolve)
        }
    }
})
router.start(App, '#app')

/* eslint-disable no-new 
new Vue({
  el: 'body',
  components: { App, LiquidoHeader }
})
*/
