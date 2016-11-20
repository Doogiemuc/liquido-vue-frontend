<template src="../views/proxies.html"></template>

/**
 * On the proxy page a voter can add and remove his proxies
 * in each area.
 */

<script>

var areaService = require('../services/AreaService.js')
var userService = require('../services/UserService.js')
var delegationService = require('../services/DelegationService.js')

/* input field with autocomplete from https://github.com/JosephusPaye/Keen-UI */
import UiAutocomplete from 'keen-ui/lib/UiAutocomplete'

export default {
  data () {
    return {
      areas: [],
      proxyMap: {},
      autocompleteKeys: {
        text: 'email',
        value: 'email',
        image: 'profile.picture'   // <= do notation is not supported by UiAutocomplete :-(
      },
      allVoters: [],
      editArea: null,      // the area of the proxy that is currently beeing edited
      chosenProxy: null    // value of autocomplete input field
    }
  },

  components: {
    UiAutocomplete
  },

  methods: {
    lazyLoadAllVoters: function() {
      var that = this
      if (this.allVoters.length == 0) {
        userService.getAll().then(users => {
          console.log("setting allVoters")
          that.allVoters = users.map(user => {
            return {
              text:  user.email,
              value: user.email,
              image: user.profile.picture
            }
          })
        })
      }
    },

    editProxy: function(area) {
      this.editArea = area
      this.lazyLoadAllVoters()
      $('#editProxyModal').modal({show:true})
    },

    getProxyName: function(area) {
      console.log("get proxyName")
      if (!area || !this.proxyMap[area._id.$oid]) return ''
      return this.proxyMap[area._id.$oid].profile.name +
        ' <'+this.proxyMap[area._id.$oid].email+'>'
    },

    getAreaId: function(area) {
      return areaService.getId(area)
    },

    saveProxy: function(chosenProxy) {
      console.log("setProxy:", chosenProxy)

    },

  },

  watch: {
    chosenProxy: function(input) {
      console.debug("chosenProxy = "+input)
    }
  },

  ready () {
    //console.log("Proxies.vue READY user=", this.$router.$currentUser)

    // areas => delegations => users
    var that = this
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

      that.$root.proxyMap = proxyMap    // also store proxyMap in root Vue instance

      return proxyMap
    }

    var loadAllAreas = function(proxyMap) {
      return areaService.getAll().then((areas) => {
        that.areas = areas       // Vue magic: These assignment will dynamically update the UI.
        that.proxyMap = proxyMap
        //console.log("Areas", areas)
        //console.log("proxyMap: ", JSON.stringify(proxyMap, ' ', 2))
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
