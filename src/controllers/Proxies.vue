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
    this.$root.fetchAllAreas().then(areas => { this.areas = areas })
    this.$root.fetchProxyMap().then(proxyMap => { this.proxyMap = proxyMap })
  }

}
</script>

<style>

</style>
