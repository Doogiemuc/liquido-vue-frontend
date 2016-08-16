<template src="../views/proxies.html"></template>

<script>

var areaService = require('../services/AreaService.js')
var userService = require('../services/UserService.js')

export default {
  data () {
    return {
      areas: [],
      proxy: {}
    }
  },
  
  created () { 
    console.log("Proxies.vue created")
    
    areaService.getAll().then((areas) => {
      this.areas = areas  
    })
    userService.getProxies(this.$router.$currentUser).then((proxies) => {
      console.log("Proxies\n", proxies)
      this.proxies = proxies
    })
    
    
  }
}
</script>

<style>

</style>
