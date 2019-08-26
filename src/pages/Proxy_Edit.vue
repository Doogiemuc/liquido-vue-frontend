<template>
  <div class="container">
    <h1>Edit Proxy in '{{category.title}}'</h1>
    <p>&nbsp;</p>

    <div class="row">

      <div class="col-sm-8">
		<doogie-table-filters
			ref="proxyTableFilters"
			:filtersConfig="filtersConfig"
		/>
		<doogie-table
			id="proxyTable"
			ref="proxyTable"
			:initialRowData="userList"
			:rowFilterFunc="rowFilterFunc"
			:columns="usersColumns"
			:primary-key-for-row="userKey"
			:show-row-numbers="false"
			:highlightSelectedRow="true"
			v-on:rowSelected="rowSelected"
		></doogie-table>
      </div>

      <div class="col-sm-4">
		<p>&nbsp;</p>

        <div class="panel panel-default" v-if="proxy">
          <div class="panel-heading">
            <h4>Your proxy in '{{category.title}}'</h4>
          </div>
          <div class="panel-body">
            <div>
              <img :src="proxy.profile.picture" class="avatarImg pull-left"/>
              {{proxy.profile.name}}<br/>
              &lt;{{proxy.email}}&gt;
              <br/><br/>
              <button type="button" @click="removeProxy()" class="btn btn-danger pull-right">Remove delegation</button>
            </div>
          </div>
        </div>

        <div class="panel panel-default" v-else>
          <div class="panel-heading">
            <h4>No proxy</h4>
          </div>
          <div class="panel-body">
            <div>
              <p>You currently have no proxy assigned in this area. You can select one from the table at the left.</p>
			  <p><input type="checkbox" v-model="transitive" />&nbsp;assign as transitive proxy</p>
              <button type="button" class="btn btn-primary pull-right" v-bind:disabled="this.selectedProxy == null" @click="assignProxy()">Assign proxy</button>
            </div>
          </div>
        </div>

        <button type="button" @click="goBack" class="btn btn-default">&laquo; Back</button>
      </div>

    </div>
  </div>
</template>

/**
 * Proxy_Edit.vue - assign or remove a proxy in one given category.
 */
<script>

import _ from 'lodash'
import DoogieTable from '../components/DoogieTable'
import DoogieTableFilters from '../components/DoogieTableFilters'
import loglevel from 'loglevel'
var log = loglevel.getLogger('ProxyEdit.vue');

export default {
  components: {
    DoogieTable, DoogieTableFilters
  },

  // caller MUST pass the category. We assume that all callers already have loaded this info
  // The delegation will be loaded if not passed
  props: {
    'category':   { type: Object, required: true },
    'delegation': { type: Object, required: false },
  },

  data () {
    return {
      proxy: this.delegation ? this.delegation.toProxy : undefined,
      selectedProxy: undefined,         // currently selected row in the table
      transitive: true,                 // assign transitive proxy checkbox
      userList: [],                     // list of available users that could be assigned as proxies
      usersColumns: [
        { title: "Avatar", path: "profile.picture", vueFilter: 'userPicture', rawHTML: true },
        { title: "Name", path: "profile.name" },
        { title: "Email", path: "email" },
      ],
      userKey: "_links.self.href",
      filtersConfig: [
        {
          type: "textSearch",
          id: "proxySearch",
          placeholder: "Search for proxy name or email"
        }
      ]
    }
  },

  filters: {        // Vue "filters" should be called "formatters". They are not filtering anything. They are (re-)formatting.
    userAvatar(pic) {                   // filter for table cell
      return '<img src="'+pic+'" />'
    }
  },

  methods: {
    /**
     * Fetch all users that could be assigned as proxy.
     * ie. all users minus the currently logged in user and any already assigned proxy
     * @return (A Promise that will resolve to) a list of users that could be assigned as proxy
     */
    getAssignableProxies() {
      return this.$root.api.getAllUsers().then(userList => {
        _.remove(userList, user => {
          return user.email == this.$root.currentUser.email ||
                 (this.proxy != null && user.email == this.proxy.email)
		})
		this.userList = userList
        return userList
      })
    },

    rowSelected(row) {
      this.selectedProxy = row
	},
	
	/** Filter rows of table by search for email or profile.name of proxy */
	rowFilterFunc(row) {
		return true;
		var currentFilters = this.$refs.proxyTableFilters.currentFilters
		if (!currentFilters || currentFilters.proxySearch === undefined) return true
		console.log("Filtering row ", JSON.stringify(currentFilters))
		var searchRegex = new RegExp(currentFilters.proxySearch, "i")
		return (!currentFilters.proxySearch || (
			searchRegex.test(row.email) ||
			searchRegex.test(row.profile.name)
		))
	},
	
    /**
     * Save the currently selected proxy. This can overwrite any existing proxy
     */
    assignProxy() {
      log.debug("assignProxy: set '"+this.selectedProxy.email+"' as proxy for '"+this.$root.currentUser.email+"' in category '"+this.category.title+"'")
      this.$root.api.getVoterToken(this.category, process.env.tokenSecret, false).then(token => {
        this.$root.api.assignProxy(this.category, this.selectedProxy, token.voterToken, this.transitive).then(res => {
          log.debug(this.$root.currentUser.email + " assigned proxy '"+this.selectedProxy.email+"' in category '"+this.category.title+"'")
          this.proxy = this.selectedProxy
          iziToast.success({
            title: 'OK',
            message: "Proxy assigned successfully."
          })
        })
        .catch(err => {
          log.error("Couldn't assign proxy: ", err)
          iziToast.error({
            title: 'Error',
            message: "Couldn't assign proxy.<br/>Please try again later.",
            timout: 20000,
          })
        })
      })
    },

    /** remove the currently set proxy */
    removeProxy() {
      log.debug("Removing proxy in category ", this.category)
      this.$root.api.getVoterToken(this.category, process.env.tokenSecret, false).then(token => {
        this.$root.api.removeProxy(this.category, token.voterToken).then(res => {
          this.proxy = undefined
          iziToast.success({
            title: 'OK',
            message: "Proxy removed."
          });
        })
        .catch(err => {
          log.error("Couldn't remove proxy: ", err)
          iziToast.error({
            title: 'Error',
            message: "Couldn't remove proxy.<br/>Please try again later.",
            timout: 20000,
          });
        })
      })
    },

    goBack() {
      this.$router.push({name: 'proxies'})
    },
  },

  filters: {
    userPicture(picturePath) {
      return '<img src="'+picturePath+'" />'
    }
  },

  /** if delegation is not passed as parameter, then load it from backend */
  created() {
    if (!this.delegation) {
      this.$root.api.getMyProxy(this.category).then(proxyInfo => {
        this.delegation = proxyInfo.directProxyDelegation
      })
    }
  },

  /**
   * Pre load all data for the page:
   *  - category
   *  - assignable proxies
   *  - the proxy map of the currenlty logged in useer
   */
  mounted () {   // must do this in mounted, because only then $refs are available
    this.$refs.proxyTable.setSort(this.usersColumns[1])
    this.getAssignableProxies().then(list => {
		console.log("list", list)
		this.$refs.proxyTable.setRowData(list)
	})
  }

}
</script>

<style scoped>
  .panel-heading h4 {
    margin-top: 0;
    margin-bottom: 0;
  }
  .avatarImg {
    margin-right: 0.5em;
  }

  #proxyTable td {
    vertical-align: middle;
  }

</style>
