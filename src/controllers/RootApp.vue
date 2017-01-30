<template>
  <div>
    <liquido-header :current-user="this.$root.currentUser"></liquido-header>
    <router-view></router-view>
  </div>
</template>

<script>
/**
 * RootApp.vue - Vue component at the root of the componente tree.
 * The only reason for this class is // https://vuejs.org/v2/guide/installation.html#Standalone-vs-Runtime-only-Build
 */

import LiquidoHeader from '../components/LiquidoHeader'

//=========================================
// RootApp - Vue component
//=========================================

export default {

  components: { LiquidoHeader },

  /*
  mounted () {
    console.log("RootApp=", this)
  }
  */

  //TODO: make RootApp testable on its own: Problem: How to hanlde <router-view> ?

  //TODO: I could load the default user here in  beforeCreate()
}
</script>
