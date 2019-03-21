<template>
<div id="#SearchPage" class="container-fluid">
  <h1>Search for Ideas, Proposals and Laws</h1>

	<div>
    <div class="pull-right">
      {{laws.length}}&nbsp;of&nbsp;{{totalElements}}&nbsp;
      <span v-on:click="reloadFromServer" class="reloadIcon">
        <i class="fa fa-sync-alt" title="Reload table data from server" ></i>
      </span>
    </div>
  	<doogie-filter
			:filtersConfig="filtersConfig"
			ref="tableFilter"
			v-on:filtersChanged="filtersChanged"
		/>
	</div>

  <doogie-table
    :initialRowData="laws"
    :columns="tableColumns"
    :fixedRowHeight="63"
    :primary-key-for-row="lawKey"
    :message="tableMessage"
    :show-add-button="false"
    v-on:saveNewValue="saveNewValue"
    v-on:sortingChanged="sortingChanged"
    v-on:appendData="appendData"
    v-on:cellClicked="cellClicked"
    ref="searchTable"
    id="searchTable"
  />
</div>

</template>

<script>
import DoogieTable from '../components/DoogieTable'
import DoogieFilter from '../components/DoogieFilter'
import TableSupportButton from  '../components/TableSupportButton'
import moment from 'moment'


export default {
  components: {
    DoogieTable,
    DoogieFilter,
    TableSupportButton,
  },

  data () {
    var that = this
    return {
      // Data for DoogieTable.vue
      tableColumns: [
        { title: "Title", path: "title", editable: false, rawHTML: false },
        { title: "Description", path: "description", editable: false, rawHTML: true },
        { htmlTitle: '<i class="fa fa-user"></i>', path: "createdBy", vueFilter: 'userAvatar', rawHTML: true },
        { htmlTitle: '<i class="fas fa-thumbs-up"></i>',
				  path: "numSupporters",
					cellComponent: TableSupportButton,       // this cell has its own Vue component that is interactive
					cellComponentProps: {
            supporterAdded: this.supporterAdded
          }
				},
        { htmlTitle: '<i class="fa fa-bookmark"></i>', path: "area.title", vueFilter: 'makeSmall', rawHTML: true },
        { title: "Created", path: "createdAt", vueFilter: 'localizeDateSmall', rawHTML: true },
        { title: "Last activity", path: "updatedAt", vueFilter: 'fromNowSmall', rawHTML: true },
      ],
      lawKey: "_links.self.href",
      tableMessage: "loading ...",

      laws: [],
      totalElements: 0,   // total overall number of available rows from backend
      sortByCol: undefined,
      sortOrder: undefined,

			//===== data for DoogieFilter.vue

			filtersConfig: [
        {
          type: "search",
          id: "searchID",
          name: "Free text search"
        },
        {
          type: "multi",
          id: "statusID",
          name: "Status",
          options: [
            { displayValue: "Idea", value: "IDEA"},
            { displayValue: "Proposal", value: "PROPOSAL"},
            { displayValue: "Elaboration", value: "ELABORATION"},
            { displayValue: "Voting", value: "VOTING"},
            { displayValue: "Law", value: "LAW"},
          ]
        },
        {
          type: "dateRange",
          id: "updatedAtID",
          name: "Updated"
        },
        {                     // MUST be array element index == 3, so that we cann fill options array later
          type: "select",
          id: "categoryID",
          name: "Category",
          options: []
        },
        {                     // MUST be array element index == 4
          type: "selectWithSearch",
          id: "createdByID",
          name: "Created by",
          options: [],
					onChange: function(filter, newDisplayValue, newValue) {
						console.log("selectWithSearch onChange")
						var currentUser = this.$root.currentUser
						if (currentUser.email !== newValue) {
							console.log("clearFilter(createdByYouId)")
							this.clearFilter("createdByYouID")   // this is a DoogieFilter instance
						}
					}
        },
        {
          type: "toggle",
          id: "createdByYouID",
          name: "Created by you",
          onChange: function(filter, active) {
            if (active) {
              var currentUser = this.$root.currentUser
              // When "My Ideas" is clicked, then also set the value of the other CreatedBy filter
              console.log("toggle active")
							this.setFilterValue('createdByID', currentUser.profile.name, currentUser.email)
            } else {
              console.log("toggle DEactive - clearFilter createdById")
							this.clearFilter('createdByID')
            }
          },
        },
        {
          type: "toggle",
          id: "supportedByCurrentUser",
          name: "Supported by you",
        }

      ],
    }
  },

  computed: {

  },

  methods: {
    // Compute the filter query for the backend from the tableFilter component
    getSearchQuery(offset) {
      var query = { }
      if (!this.$refs || !this.$refs.tableFilter || !this.$refs.tableFilter.currentFilters) return query

      var f = this.$refs.tableFilter.currentFilters
      if (f.searchID.value) {
        query.searchText = f.searchID.value
      }
      if (f.statusID.value && f.statusID.value.length >= 1) {
        query.statusList = f.statusID.value  // array of status
      }
      if (f.categoryID.value) {
        query.areaId = f.categoryID.value
      }
			
      if (f.createdByYouID.value) {
				query.createdByEmail = this.$root.currentUser.email
			} else if (f.createdByID.value) {
        query.createdByEmail = f.createdByID.value
      }
			
      if (f.updatedAtID.value) {
        query.updatedAfter = f.updatedAtID.value.start
        query.updatedBefore = f.updatedAtID.value.end
      }
      if (f.supportedByCurrentUser.value) {
        query.supportedByEMail = this.$root.currentUser.email
      }

      //offset and limit
      query.offset = offset || 0
      query.limit  = 22

      //sorting
      if (this.sortByCol) {
        query.sortByProperties = [ this.sortByCol.path ]
      }
      if (this.sortOrder) {
        query.direction = this.sortOrder > 0 ? "ASC" : "DESC"
      }

      return query
    },

    /**
     * save an updated value of an Idea
     * This is called when the EditableCell component fires the "saveNewValue" event
     * @param {String} ideaURI the full ideaURI which shall be updated (which is the rowId in SearchTable!)
     * @param {Object} column Which column has been edited.
     * @param {Any} value The new value that the user has entered or chosen. As returned by the EditableCell component.
     */
    saveNewValue(ideaURI, column, value) {
      console.log("saveNewValue event in Search.vue:", ideaURI, column, value);
      var patchedIdea = {}
      patchedIdea[column.path] = value    // only send the updated key, e.g. { title: "new title" } in a PATCH request
      this.$root.api.patch(ideaURI, patchedIdea)
    },

		/**
     * Called when the advanced filters above the table have changed. Then we reload all the data from the backend.
     * @param {object} newFilters the new filter configuration
     */
		filtersChanged(newFilters) {
			console.log("Search.filtersChanged", newFilters)
      this.reloadFromServer()
		},

    sortingChanged(sortByCol, sortOrder) {
      //console.log("searchTable.sortingChanged", sortByCol, sortOrder)
      this.sortByCol = sortByCol
      this.sortOrder = sortOrder
      this.reloadFromServer()
    },

		/**
		 * callback when supporter was added to idea
		 * @param {object} idea the supported idea <b>IN ITS OLD STATE!!!</b>.  Needs to be reloaded!
		 */
		supporterAdded(idea) {
      this.$root.api.addSupporterToIdea(idea, this.$root.currentUser).then(res => {
        iziToast.success({
            title: 'Liked',
            message: 'Thank you for supporting this idea.',
        });
      })
		},

    /** When user clicks on the title of an idea, then open that idea */
    cellClicked(idea, col) {
      if (col.path === "title") {
        this.$router.push('/ideas/'+idea.id)
      }
    },

    /**
     * Reload (filtered) tabledata from the server.
     */
		reloadFromServer() {
      this.tableMessage = "loading ..."
      var query = this.getSearchQuery(0)
      this.$root.api.findByQuery(query).then(result => {
				this.laws = result._embedded.laws || []
        this.totalElements = result.totalElements
				this.tableMessage = this.laws.length < this.totalElements ? "ready to load more rows ..." : undefined
        this.$refs.searchTable.setRowData(this.laws)
			})
			.catch(err => { console.log("ERROR loading search result: ", err) })
		},

    appendData(rowData) {
      if (rowData && rowData.length >= this.totalElements) {
        this.tableMessage = undefined
        return;      // all data is already loaded
      }
      console.log("loading additional table data")
      this.tableMessage = "loading additional data ..."
      var query = this.getSearchQuery(rowData.length)
      this.$root.api.findByQuery(query).then(result => {
        var newLaws = result._embedded.laws
        this.totalElements = result.totalElements
        this.tableMessage = "ready to load more rows ..."
        this.$refs.searchTable.appendRowData(newLaws)
      })
      .catch(err => { console.log("ERROR appending to search result: ", err) })

    }

  },

  /**
   * Initially load users and categories for selects.
   * Filter for ideas by default. Load first set of ideas.
   */
  mounted() {
    this.$root.api.getAllCategories().then(categories => {
      this.filtersConfig[3].options = categories.map(cat => { return { value: cat.id, displayValue: cat.title } } )
    })
    this.$root.api.getAllUsers().then(users => {
      this.filtersConfig[4].options = users.map(user => { return { value: user.email, displayValue: user.profile.name } } )
    })
    this.$refs.tableFilter.applyMultiSelect(this.filtersConfig[1], ["IDEA"])
		//this.reloadFromServer()   no need to reload. Changing the filter will automatically trigger a reload
  },

  /** These are vue "filters". They convert the passed value into a format that shows to the user. (They should be called converters by vue.) */
  filters: {
    userAvatar(user) {
      return '<img src="'+user.profile.picture+'" title="'+user.profile.name +' <'+ user.email +'>" />'
    },

    makeSmall(str) {
      return '<small>'+str+'</small>'
    },

    localizeDateSmall(dateVal) {
      return '<small>'+moment(dateVal).format('L')+'</small>'
    },

    fromNowSmall(dateVal) {
      return '<small>'+moment(dateVal).fromNow()+'</small>'
    },

  },

}
</script>

<style>
  .reloadIcon {
    cursor: pointer;
  }
  /* Clickable title col */
  #searchTable tbody tr td:nth-child(2) {
    cursor: pointer;
  }
</style>
