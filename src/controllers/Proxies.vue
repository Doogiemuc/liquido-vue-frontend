<template src="../views/proxies.html"></template>

<script>

var areaService = require('../services/AreaService.js')
var userService = require('../services/UserService.js')
var delegationService = require('../services/DelegationService.js')

export default {
  data () {
    return {
      areas: [],
      proxies: []
    }
  },

  ready () {
    console.log("Proxies.vue READY")
    areaService.getAll().then((areas) => {
      console.log("Areas:", areas)
      this.areas = areas  // Vue magic: This assignment will dynamically update the UI, when ready
    })
    console.log("======== getAllProxies() currentUser=",this.$router.$currentUser)
    delegationService.getDelegationsFrom(userService.getId(this.$router.$currentUser)).then(delegations => {
      console.log("Delegations:", delegations)
      //populate user information of all proxies
      delegationService.populateAll(delegations, 'to', userService).then(populatedDelegations => {
        console.log("populatedDelegations:", populatedDelegations[0])
        this.proxies = populatedDelegations
      })
    })
  }

}
</script>

<style>

</style>
