<template src="../views/proxyEdit.html"></template>

/**
 * ProxyEdit.vue - set or remove a proxy in one given area.
 */

<script>

var areaService = require('../services/AreaService.js')
var userService = require('../services/UserService.js')
var delegationService = require('../services/DelegationService.js')

import DoogieTable from '../components/DoogieTable'

export default {
  data () {
    return {
      area: { title: '' },      // the area of the proxy that is currently beeing edited, will be loaded in ready()
      allVoters: [],
      usersColumns: [
        { title: "Avatar", path: "profile.picture", filter: 'userAvatar', rawHTML: true },
        { title: "Name", path: "profile.name" },
        { title: "Email", path: "email" },
      ],
      userKey: "_id.$oid",
      proxy: null,             // proxy in this area
    }
  },

  components: {
    DoogieTable
  },

  filters: {
    userAvatar(pic) {
      return '<img src="'+pic+'" />'
    }
  },

  computed: {
    //return true if one row in the table is selected (will enable "Set Proxy" button)
    isProxySelected: function() {
      //console.log("isProxySelected "+JSON.stringify(this.$refs.voterTable.selectedRow) )
      return this.$refs.voterTable.selectedRow != null
    },
  },

  methods: {

    // save the currently selected proxy
    saveProxy: function() {
      var chosenProxy = this.$refs.voterTable.selectedRow
      console.log("saveProxy:", chosenProxy)

    },

    removeDelegation: function() {
      console.log("Removing delegation in area ", this.area)
    }
  },

  ready () {
    var that = this
    this.$refs.voterTable.loading = true
    this.$refs.voterTable.localizedTexts.searchFilter = 'Search for name or e-mail'

/*
    var loadDelegation = function() {
      var userId = userService.getId(that.$router.$currentUser)
      var areaId = areaService.getId(that.area)

      // try to get proxy user information from the cache
      if (that.$root.proxyMap && that.$root.proxyMap[areaId]) {
        console.debug("found proxy in $root.proxyMap cache")
        that.proxy = that.$root.proxyMap[areaId]
        return that.proxy
      }

      // otherwise reload proxy from DB
      return delegationService.findByUserAndArea(userId, areaId).then(delegation => {
        if (delegation == null) {
          console.debug("UserId="+userId+" has no delegation in areaId="+areaId)
          return null
        }
        return delegationService.populate(delegation, 'toProxy', userService).then(populatedDelegation => {
          that.proxy = populatedDelegation.toProxy
        })
      })
    }
*/

    // Load all list of areas (from cache is possible, otherwise from areaService)
    // Implementation note: Need to bind the this context of the areaService.getAll() function to the areaService
    that.$router.cache.load('allAreas', areaService.getAll.bind(areaService))
    .then(areas => { that.areas = areas })

    that.$router.cache.load('proxyMap', delegationService.loadProxyMap.bind(delegationService))
    .then(proxyMap => {
      var areaId = that.$route.query.areaId
      if (areaId == undefined || areaId == null) {
        console.error("ProxyEdit.vue: Missing URL parametere areaId!")
      }
      that.proxy = proxyMap[areaId]
    })

    that.$router.cache.load('allUsers', userService.getAll.bind(userService))
    .then(users => {
      that.allVoters = users
      that.$refs.voterTable.setSortCol(that.usersColumns[1])
      that.$refs.voterTable.loading = false
    })

/*
    loadArea(that.$route.query.areaId)
    .then(loadDelegation)
    .then(loadAllVoters)
    .catch(err => {
      console.error("ERROR in Proxies.vue "+err)
    })
*/


  }

}
</script>

<style>
.buttonMarginRight {
  margin-right: 20px;
}
#searchDiv {
  margin-bottom: 12px;
}
#searchDiv input {
  width: 100%;
}

</style>
