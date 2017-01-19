<template src="../views/proxies.html"></template>

/**
 * On the proxy page a voter can add and remove his proxies
 * in each area.
 */

<script>

import apiClient from '../services/LiquidoApiClient'

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
      return area.id
    },

  },
 
  mounted () {
    apiClient.fetchAllAreas().then(areas => { this.areas = areas })


    //this.$root.liquidoCache.fetchProxyMap(this.$root.currentUser).then(proxyMap => { this.proxyMap = proxyMap })
  }

}
</script>

<style>

</style>
