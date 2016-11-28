<template>
  <div>
    <liquido-header></liquido-header>
    <router-view></router-view>
  </div>
</template>

<script>
/**
 * RootApp - Vue component at the root of the componente tree.
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
      currentUser: null,          // ID of currently logged in user
    }
  },

}
</script>
