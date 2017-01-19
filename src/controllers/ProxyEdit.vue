<template src="../views/proxyEdit.html"></template>

/**
 * ProxyEdit.vue - set or remove a proxy in one given area.
 */

<script>

import _ from 'lodash'
import userService from '../services/UserService.js'
import areaService from '../services/AreaService.js'
import delegationService from '../services/DelegationService.js'
import DoogieTable from '../components/DoogieTable'
import loglevel from 'loglevel'

var log = loglevel.getLogger('ProxyEdit.vue');

export default {
  data () {
    return {
      area: { title: '' },      // the area of the proxy that is currently beeing edited, will be loaded in ready()
      proxy: null,              // user information of currently set proxy in this area (if any)
      // list of available users that could be assigned as proxies
      userList: [],
      usersColumns: [
        { title: "Avatar", path: "profile.picture", filter: 'userAvatar', rawHTML: true },
        { title: "Name", path: "profile.name" },
        { title: "Email", path: "email" },
      ],
      userKey: "_id.$oid",

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
    }
  },

  methods: {
    /**
     * Fetch all users that could be assigned as proxy.
     * ie. all users minus the currently logged in user and any already assigned proxy
     * @return (A Promise that will resolve to) a list of users that could be assigned as proxy
     */
    getAssignableProxies: function() {
      return this.$root.liquidoCache.fetchAllUsers().then(userList => {
        _.remove(userList, user => {
          return user == this.$root.currentUser ||
                 user == this.proxy
        })
        return userList
      })
    },

    /** save the currently selected proxy */
    saveProxy: function() {
      var chosenProxy = this.$refs.voterTable.selectedRow
      var currentUserId = userService.getId(this.$root.currentUser)
      var areaId        = areaService.getId(this.area)
      var proxyId       = userService.getId(chosenProxy)
      log.debug("saveProxy: set '"+chosenProxy.email+"' as proxy for '"+this.$root.currentUser.email+"' in area '"+this.area.title+"'")
      delegationService.saveProxy(currentUserId, areaId, proxyId)
      .then(result => {
        log.debug("Successfully saved proxy:", result)
        this.proxy = chosenProxy
        this.$root.liquidoCache.deleteProxyMap()   // flush the complete proxy map
      })
      .catch(err => {
        log.error("Couldn't save proxy: ", err)
      })
    },

    /** remove the currently set proxy */
    removeProxy: function() {
      log.debug("Removing proxy in area ", this.area)
      delegationService.removeProxy(currentUserId, areaId)
      .catch(err => {
        log.error("Couldn't remove proxy: ", err)
      })
    }
  },

  /**
   * Pre load all data for the page:
   *  - area
   *  - assignable proxies
   *  - the proxy map of the currenlty logged in useer
   * from remote source of from caches if possible.
   */
  mounted () {
    log.trace('ProxyEdit.vue: mounted')
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
      this.getAssignableProxies(),
      this.$root.liquidoCache.fetchProxyMap(this.$root.currentUser)
    ])
    .then(results => {
      this.area     = results[0]

      this.userList = results[1]

      var proxyMap  = results[2]
      this.proxy    = proxyMap[areaId]
      this.$refs.voterTable.loading = false

    })
    .catch(err => {
      log.error("Couldn't load data for ProxyEdidt.vue: "+err)
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
