<template src="../views/proxies.html"></template>

/**
 * On the proxy page a voter can add and remove his proxies
 * in each area.
 */

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
    getProxyName: function(area) {
      if (!area || !this.proxyMap[area._id.$oid]) return ''
      return this.proxyMap[area._id.$oid].profile.name +
        ' <'+this.proxyMap[area._id.$oid].email+'>'
    },

    getAreaId: function(area) {
      return areaService.getId(area)
    },

  },

  ready () {
    var that = this

    /*
    var loadAllAreas = function() {
      return areaService.getAll()
    }

    // First get all delegations for the currently logged in user and populate their toProxy attribute with the user information
    var getPopulatedDelegations = function() {
      return delegationService.getDelegationsFrom(that.$root.currentUserId)
        .then(delegations => {
          return delegationService.populateAll(delegations, 'toProxy', userService)
        })
    }

    // then create a map   areaId => proxy user in that area
    var createProxyMap = function(populatedDels) {
      var proxyMap = {}
      for(let delegation of populatedDels) {
        var areaId = delegation.area.$oid
        proxyMap[areaId] = delegation.toProxy
      }
      return proxyMap
    }

    var loadProxyMap = function() {
      return getPopulatedDelegations().then(createProxyMap)
    }
    */

    this.$root.fetchAllAreas().then(areas => { that.areas = areas })
    this.$root.fetchProxyMap().then(proxyMap => { that.proxyMap = proxyMap })

    /*
    that.$router.cache.load('allAreas', areaService.getAll.bind(areaService))
    .then(areas => { that.areas = areas })
    .catch(err => { console.error("ERROR loading areas is Proxies.vue "+err) })


    that.$router.cache.load('proxyMap', loadProxyMap)
    .then(proxyMap => { that.proxyMap = proxyMap })
    .catch(err => { console.error("ERROR loading ProxyMap in Proxies.vue "+err) })
    */
  }

}
</script>

<style>

</style>
