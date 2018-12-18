<template>
  <div class="container">
    <h1>Edit Proxy in '{{category.title}}'</h1>
    <p>&nbsp;</p>

    <div class="row">

      <div class="col-sm-8">
        <div class="panel panel-default">
          <div class="panel-heading">
            <h4>Assign proxy</h4>
          </div>
          <div class="panel-body">
            <doogie-filter
              :filtersConfig="filtersConfig"
              ref="proxyTableFilter"
            />
            <doogie-table
              id="proxyTable"
              :row-data="userList"
              :columns="usersColumns"
              :primary-key-for-row="userKey"
              :loading="true"
              :show-add-button="false"
              :show-row-numbers="false"
              :selectable-rows="true"
              v-on:rowSelected="rowSelected"
              :rowFilterFunc="rowFilterFunc"
              ref="proxyTable"
            ></doogie-table>

            <div class="buttonWrapper">
              <button type="button" class="btn btn-primary pull-right" v-bind:disabled="this.selectedProxy == null" @click="assignProxy()">Assign selected proxy</button>
            </div>

          </div>
        </div>
      </div>

      <div class="col-sm-4">
        <div class="panel panel-default">
          <div class="panel-heading">
            <h4>Your proxy in '{{category.title}}'</h4>
          </div>
          <div class="panel-body">
            <div v-if="proxy">
              <img v-bind:src="proxy.profile.picture" />&nbsp;{{proxy.profile.name}} &lt;{{proxy.email}}&gt;
              <br/><br/>
              <button type="button" @click="removeProxy()" class="btn btn-danger">Remove delegation to this proxy</button>
            </div>
            <div v-else>
              <h4>Currently no proxy is assigned</h4>
              <p>You currently have no proxy assigned in this category.</p>
            </div>
            <br/><br/>
            <router-link to="/proxies" class="btn btn-default pull-right" role="button">&laquo; Back</router-link>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

/**
 * ProxyEdit.vue - set or remove a proxy in one given category.
 */

<script>

import _ from 'lodash'
import DoogieTable from '../components/DoogieTable'
import DoogieFilter from '../components/DoogieFilter'
import loglevel from 'loglevel'

var log = loglevel.getLogger('ProxyEdit.vue');

export default {
  data () {
    return {
      category: { title: '' },      // the category of the proxy that is currently beeing edited, will be loaded in ready()
      proxy: null,                  // user information of currently set proxy in this category (if any)
      selectedProxy: null,          // currently selected row in the table
      // list of available users that could be assigned as proxies
      userList: [],
      usersColumns: [
        { title: "Avatar", path: "profile.picture", vueFilter: 'userPicture', rawHTML: true },
        { title: "Name", path: "profile.name" },
        { title: "Email", path: "email" },
      ],
      userKey: "_links.self.href",
      filtersConfig: [
        {
          type: "search",
          id: "searchID",
          displayName: "Search for proxy"
        }
      ]
    }
  },

  components: {
    DoogieTable,
    DoogieFilter
  },

  filters: {
    userAvatar(pic) {                   // filte for table cell
      return '<img src="'+pic+'" />'
    }
  },

  methods: {
    /**
     * Fetch all users that could be assigned as proxy.
     * ie. all users minus the currently logged in user and any already assigned proxy
     * @return (A Promise that will resolve to) a list of users that could be assigned as proxy
     */
    getAssignableProxies: function() {
      return this.$root.api.getAllUsers().then(userList => {
        _.remove(userList, user => {
          return user.email == this.$root.currentUser.email ||
                 (this.proxy != null && user.email == this.proxy.email)
        })
        return userList
      })
    },

    rowSelected: function(row) {
      this.selectedProxy = row
    },

    /** Filter rows of table by search for email or profile.name of proxy */
    rowFilterFunc(row) {
      var currentFilters = this.$refs.proxyTableFilter.currentFilters
      var searchRegex = new RegExp(currentFilters.searchID.value, "i")
      return (!currentFilters.searchID.value || (
          searchRegex.test(row.email) ||
          searchRegex.test(row.profile.name)
        ))
    },

    /**
     * Save the currently selected proxy. This can overwrite any existing proxy
     */
    assignProxy: function() {
      log.debug("assignProxy: set '"+this.selectedProxy.email+"' as proxy for '"+this.$root.currentUser.email+"' in category '"+this.category.title+"'")

      this.$root.api.assignProxy(this.category, this.selectedProxy)
      .then(result => {
        log.debug("Successfully saved proxy:", result)
        this.proxy = this.selectedProxy  // this we we do not need to reload the proxy's user information from the server
        iziToast.success({
          title: 'OK',
          message: "Proxy assigned successfully."
        });
      })
      .catch(err => {
        log.error("Couldn't assign proxy: ", err)
        iziToast.error({
          title: 'Error',
          message: "Couldn't assign proxy.<br/>Please try again later.",
          timout: 20000,
        });
      })
    },

    /** remove the currently set proxy */
    removeProxy: function() {
      log.debug("Removing proxy in category ", this.category)
      this.$root.api.removeProxy(this.category)
      .then(result => {
        this.proxy = null
      })
      .catch(err => {
        log.error("Couldn't remove proxy: ", err)
      })
    }
  },

  filters: {
    userPicture(picturePath) {
      return '<img src="'+picturePath+'" />'
    }
  },

  /**
   * Pre load all data for the page:
   *  - category
   *  - assignable proxies
   *  - the proxy map of the currenlty logged in useer
   */
  mounted () {
    var categoryId = this.$route.query.categoryId
    if (categoryId == undefined || categoryId == null) {
      console.error("Proxy_Edit.vue: Missing URL parametere categoryId!")
    }

    this.$refs.proxyTable.loading = true
    //this.$refs.proxyTable.localizedTexts.searchFilter = 'Search for name or e-mail'
    this.$refs.proxyTable.setSortCol(this.usersColumns[1])

    // Here we send three parallel requests to our backend. Javascript Promises are cool :-)
    Promise.all([
      this.$root.api.getCategory(categoryId),
      this.getAssignableProxies(),
      this.$root.api.getProxyMap(this.$root.currentUser)
    ])
    .then(results => {
      this.category = results[0]
      this.userList = results[1]
      var proxyMap  = results[2]
      if (proxyMap[this.category.title]) {   // may be null if no proxy is assigned
        this.proxy  = proxyMap[this.category.title].directProxy
      }
      this.$refs.proxyTable.loading = false
    })
    .catch(err => {
      log.error("Couldn't load data for ProxyEdidt.vue: "+err)
    })

  }

}
</script>

<style scoped>
.panel-heading h4 {
  margin-top: 0;
  margin-bottom: 0;
}
#proxyTable td {
  vertical-align: middle;
}
</style>
