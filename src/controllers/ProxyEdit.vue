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
      allUsers: [],
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
    //TODO: checkMandatoryQueryParam('areaId', 'Missing mandatory URL parameter areaId', /proxies')  // will redirect to proxies page if query param areaId is not set
    var areaId = this.$route.query.areaId
    if (areaId == undefined || areaId == null) {
      console.error("ProxyEdit.vue: Missing URL parametere areaId!")
    }

    this.$refs.voterTable.loading = true
    this.$refs.voterTable.localizedTexts.searchFilter = 'Search for name or e-mail'
    this.$refs.voterTable.setSortCol(this.usersColumns[1])

    Promise.all([
      areaService.getById(areaId),
      this.$root.fetchAllUsers(),
      this.$root.fetchProxyMap()
    ])
    .then(results => {
      this.area     = results[0]
      this.allUsers = results[1]
      var proxyMap  = results[2]
      this.proxy    = proxyMap[areaId]
      this.$refs.voterTable.loading = false
    })

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
