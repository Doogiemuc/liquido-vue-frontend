<template>
  <div>
    <liquido-header :current-user="currentUser"></liquido-header>
    <router-view></router-view>
  </div>
</template>

<script>
/**
 * RootApp.vue - Vue component at the root of the componente tree.
 * It is available to every sub component as this.$root
 */

import LiquidoCache from '../LiquidoCache'

//=========================================
// Module private methods
//=========================================


//=========================================
// RootApp - Vue component
//=========================================

export default {
  data () {
    return {
      liquidoCache: LiquidoCache, // global session cache, available to all components as this.$root.liquidoCache
      currentUser: null,          // currently logged in user,  passes as a prop to LquidoHeader
    }
  },

  //TODO: make RootApp testable on its own:   components : { "liquido-header": LiquidoHeader }    Problem: How to hanlde <router-view> ?
}
</script>
