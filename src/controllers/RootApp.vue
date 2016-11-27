<template>
  <div>
    <liquido-header></liquido-header>
    <router-view></router-view>
  </div>
</template>

<script>
/**
 * RootApp - Vue component at the root of the componente tree.
 * This component is responsible for handling the global session cache.
 * It is available to every sub component as this.$root
 */

import SessionCache from '../SessionCache'
import areaService from '../services/AreaService.js'
import userService from '../services/UserService.js'
import ideaService from '../services/IdeaService.js'
import delegationService from '../services/DelegationService.js'

//=========================================
// Module private methods
//=========================================

/** helper method that creates a map  areaId => proxy user information */
var createProxyMap = function(populatedDels) {
  var proxyMap = {}
  for(let delegation of populatedDels) {
    var areaId = delegation.area.$oid
    proxyMap[areaId] = delegation.toProxy
  }
  return proxyMap
}

/* load all information necessary for proxyMap of the currenetly logged in user*/
var loadProxyMap = function(user) {
  //console.log("===== RootApp.loadProxyMap(user=", user)
  var userId = userService.getId(user)
  return delegationService.getDelegationsFrom(userId).then(delegations => {
    return delegationService.populateAll(delegations, 'toProxy', userService).then(createProxyMap)
  })
}

var loadPopulatedIdeas = function() {
  return ideaService.getAll()
    .then(ideas => {
      return ideaService.populateAll(ideas, 'createdBy', userService)
    })
}

//=========================================
// RootApp - Vue component
//=========================================

export default {
  data () {
    return {
      cache: SessionCache,       // global session cache, available for all components
      currentUser: null,       // ID of currently logged in user
    }
  },


  methods: {
    /** lazy load all areas (from cache if possible) */
    fetchAllAreas: function() {
      return this.cache.load('allAreas', areaService.getAll.bind(areaService) )
        .catch(err => { console.error("ERROR loading areas in RootApp.vue: "+err) })
    },

    /** lazy load all ideas with populated field 'createdBy' */
    fetchAllIdeas: function() {
      return this.cache.load('populatedIdeas', loadPopulatedIdeas )
        .catch(err => { console.error("ERROR loading ideas in RootApp.vue: "+err) })
    },

    /** lazy load all users (from cache is possible) */
    fetchAllUsers: function() {
      return this.cache.load('allUsers', userService.getAll.bind(userService))
        .catch(err => { console.error("ERROR loading users in RootApp.vue: "+err) })
    },

    /* Lazyly createa a map  from areaId to user information of the proxy in that area */
    fetchProxyMap: function() {
      return this.cache.load('proxyMap', loadProxyMap, this.currentUser)
        .catch(err => { console.error("ERROR loading ProxyMap in RootApp.vue "+err) })
    }
  },

}
</script>
