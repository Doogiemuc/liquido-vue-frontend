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
var loadProxyMap = function(userId) {
  console.log("loading ProxyMap of userId="+userId)
  return delegationService.getDelegationsFrom(userId).then(delegations => {
    return delegationService.populateAll(delegations, 'toProxy', userService).then(createProxyMap)
  })
}

//=========================================
// RootApp - Vue component
//=========================================

export default {
  data () {
    return {
      cache: SessionCache,       // global session cache, available for all components
      currentUserId: null,       // ID of currently logged in user
    }
  },


  methods: {
    /** lazy load all areas (from cache if possible) */
    fetchAllAreas: function() {
      return this.cache.load('allAreas', areaService.getAll.bind(areaService))
        .catch(err => { console.error("ERROR loading areas in RootApp.vue: "+err) })
    },

    /* Lazyly createa a map  from areaId to user information of the proxy in that area */
    fetchProxyMap: function() {
      console.log("fetchProxyMap currentUserId="+this.currentUserId)
      return this.cache.load('proxyMap', loadProxyMap, this.currentUserId)
        .catch(err => { console.error("ERROR loading ProxyMap in RootApp.vue "+err) })
    }
  },

  init () {
    console.log("======= RootApp.init() ", this.currentUserId)
    userService.getAll({l:1}).then((users)=> {
      console.debug("DEVELOPMENT: automatic login of user "+users[0].email)
      this.currentUserId = userService.getId(users[0])
    })

  },

  ready () {
    console.log("======= RootApp.ready() ", this.currentUserId)
  }

}
</script>
