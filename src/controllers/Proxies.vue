<template src="../views/proxies.html"></template>

<script>

var areaService = require('../services/AreaService.js')
var userService = require('../services/UserService.js')
var delegationService = require('../services/DelegationService.js')

export default {
  data () {
    return {
      areas: [],
      proxyMap: {}
    }
  },

  methods: {
    editProxy(areaId) {
      console.log("Edit proxy in area "+areaId)
      $('#editProxyModal').on('shown.bs.modal', function () {
        console.log("focus on input")
        $('#proxySearchInput').focus()
      })
      $('#editProxyModal').modal({show:true})
    }
  },

  ready () {
    console.log("Proxies.vue READY user=", this.$router.$currentUser)
    // areas => delegations => users

    var getDelegationsFrom = function(user) {
      return delegationService.getDelegationsFrom(userService.getId(user))
    }

    var populateDelegations = function(delegations) {
      return delegationService.populateAll(delegations, 'toProxy', userService)
    }

    var createProxyMap = function(populatedDels) {
      //create map  areaId => proxyuser
      var proxyMap = {}
      for(let delegation of populatedDels) {
        //console.log("Delegation=",delegation)
        var areaId = delegation.area.$oid
        proxyMap[areaId] = delegation.toProxy
      }
      return proxyMap
    }

    var that = this
    var loadAllAreas = function(proxyMap) {
      areaService.getAll().then((areas) => {
        that.areas = areas                        // Vue magic: This assignment will dynamically update the UI, when ready
        that.proxyMap = proxyMap
        console.log("Areas", areas)
        console.log("proxyMap: ", JSON.stringify(proxyMap, ' ', 2))
      })
    }

    getDelegationsFrom(this.$router.$currentUser)
    .then(populateDelegations)
    .then(createProxyMap)
    .then(loadAllAreas)
    .catch(err => {
      console.error("ERROR in Proxies.vue "+err)
    })
  }

}
</script>

<style>

</style>
