<template src="../views/proxies.html"></template>

/**
 * On the proxy page a voter can add and remove his proxies
 * in each category.
 */

<script>

import apiClient from '../services/LiquidoApiClient'

export default {
  data () {
    return {
      categories: [],
      proxyMap: {}
    }
  },

  methods: {
    getProxyInCategory: function(category) {
      //var categoryId = this.$root.api.getId(category)
      var proxy = this.proxyMap[category.title]
      if (!proxy) return "---"
      return '<img src="' + proxy.profile.picture + '">&nbsp;' +
        proxy.profile.name + ' <' + proxy.email + '>'
    },

  },
 
  mounted () {
    this.$root.api.fetchAllCategories().then(categories => { this.categories = categories })
    this.$root.api.fetchProxyMap(this.$root.currentUser).then(proxyMap => { this.proxyMap = proxyMap })
  }

}
</script>

<style>
  #proxyTable td {
    vertical-align: center;
  }
</style>
