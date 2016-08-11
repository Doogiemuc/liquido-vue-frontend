<template src="../views/proxies.html"></template>

<script>
var areaService = require('../services/AreaService')

export default {
  data () {
    return {
      areas: [],
      proxies: {}
    }
  },
  
  created () { 
    console.log("Proxies.vue created")
    areaService.getAll().then((areas) => {
      this.data.areas = areas
    })
  }
}
</script>

<style>

</style>
