<template>
<div id="SearchPage" class="container-fluid">
  <h1>Search for Ideas, Proposals and Laws</h1>

	<div>
    <div class="pull-right">
      {{laws.length}}&nbsp;of&nbsp;{{totalElements}}&nbsp;
      <span v-on:click="reloadFromServer" class="reloadIcon">
        <i id="loadingIcon" class="fa fa-sync-alt" title="Reload table data from server" ></i>
      </span>
    </div>
  	<doogie-table-filters
			:filtersConfig="filtersConfig"
			ref="tableFilter"
			v-on:tableFiltersChanged="tableFiltersChanged"
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
    ref="SearchTable"
    id="SearchTable"
  />
</div>

</template>

<script>
import DoogieTable from '../components/DoogieTable'
import DoogieTableFilters from '../components/DoogieTableFilters'
import TableSupportButton from  '../components/TableSupportButton'
import moment from 'moment'
import _ from 'underscore'

/** lexically compare user names of createdBy for sorting */
var createdByComparator = function(val1, val2) {
  return val1.createdBy.profile.name.localeCompare(val2.createdBy.profile.name, 'lookup', { numeric: true } );
}

export default {
  components: {
    DoogieTable,
    DoogieTableFilters,
    TableSupportButton,
  },

  props: {
  	initQuery: { type: Object, required: false }
  },

  data () {
    var that = this
    return {
      // Data for DoogieTable.vue
      tableColumns: [
		{ title: "", path: "status", vueFilter: 'statusIcon', rawHTML: true},
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
      tableMessage: "",

      laws: [],
      totalElements: 0,   // total overall number of available rows from backend
      sortByCol: undefined,
      sortOrder: undefined,
      debouncedReload: undefined,
      listenToTableFilterChanges: false,  // initially we do not yet listen to changes in table fitlers. Will be activated in mounted()

	  //===== data for DoogieFilter.vue
	  filtersConfig: [
        {
          type: "textSearch",
          id: "textSearch",
          placeholder: "Free text search"
        },
        {
          type: "multiSelect",
          id: "status",
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
          id: "updatedAtRange",
          name: "Updated"
        },
        {                     // MUST be array element index == 3, so that we cann fill options array later
          type: "singleSelect",
          id: "category",
          name: "Category",
          options: []
        },
        {                     // MUST be array element index == 4
          type: "selectWithSearch",
          id: "createdByEmail",
          name: "Created by",
          options: [],
		  onChange: function(filter, newValue, oldValue) {
			var currentUser = this.$root.currentUser
			if (currentUser.email !== newValue) {
				//console.log("clearFilter(createdByYouId)")
				this.clearFilter("createdByYou")
			}
		  }
        },
        {
          type: "toggleButton",
          id: "createdByYou",
          name: "Created by you",
          onChange: function(filter, newValue, oldValue) {
            if (newValue) {
              var currentUser = this.$root.currentUser
              // When "My Ideas" is clicked, then also set the value of the other CreatedBy filter
              //console.log("toggle ACTIVATE createdByYou", this)
              //"this" is the DoogieTableFilter component
              this.setFilterValue('createdByEmail', currentUser.email, currentUser.profile.name)
            } else {
              //console.log("toggle DEactive - clearFilter createdById")
              this.clearFilter('createdByEmail')
            }
          },
        },
        {
          type: "toggleButton",
          id: "supportedByYou",
          name: "Supported by you",
        }
      ],
    }
  },

  methods: {
    // Compute the filter query for the backend from the tableFilter component
    getSearchQuery(offset) {
      var query = { }
      if (!this.$refs || !this.$refs.tableFilter || !this.$refs.tableFilter.currentFilters) return query

      var f = this.$refs.tableFilter.currentFilters
      if (f.textSearch) {
        query.searchText = f.textSearch
      }
      if (f.status && f.status.length >= 1) {
        query.statusList = f.status             // array of status
      }
      if (f.category) {
        query.areaId = f.category
      }

      if (f.createdByYou) {
				query.createdByEmail = this.$root.currentUser.email
			} else if (f.createdByEmail) {
        query.createdByEmail = f.createdByEmail
      }

      if (f.updatedAtRange) {
        query.updatedAfter = f.updatedAtRange.start
        query.updatedBefore = f.updatedAtRange.end
      }
      if (f.supportedByYou) {
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
    tableFiltersChanged(newFilters) {
      // When the table filter changes very quickly, then only load the LAST filter configuration
      if (this.listenToTableFilterChanges) this.debouncedReload()
	},

    sortingChanged(sortByCol, sortOrder) {
      //console.log("searchTable.sortingChanged", sortByCol, sortOrder)
      this.sortByCol = sortByCol
      this.sortOrder = sortOrder
      this.reloadFromServer()
    },

	/**
	 * callback when supporter was added.
	 * @param {object} idea the supported idea, proposal or law <b>IN ITS OLD STATE!!!</b>. Needs to be reloaded!
	 */
	supporterAdded(idea) {
      this.$root.api.addSupporterToIdea(idea, this.$root.currentUser).then(res => {
        iziToast.success({
          title: 'Liked',
          message: 'Thank you for supporting this.',
        });
      })
    },

    /** When user clicks on the title of an idea, then open that idea */
    cellClicked(idea, col) {
      if (col.path === "title") {
		switch(idea.status) {
			case "IDEA":
				this.$router.push('/ideas/'+idea.id)
				break;
			case "PROPOSAL":
			case "ELABORATION":
			case "VOTING":
				this.$router.push('/proposals/'+idea.id)
				break;
			default:
				this.$router.push('/laws/'+idea.id)
				break;
		}
      }
    },

    /**
     * Reload (filtered) tabledata from the server.
     */
	reloadFromServer() {
      this.tableMessage = "loading ..."
      $('#loadingIcon').addClass('fa-spin')
      var query = this.getSearchQuery()
      console.log("reloadFrom server", query)
      this.$root.api.findByQuery(query).then(result => {
        this.laws = result._embedded.laws || []
        this.totalElements = result.totalElements
        if (this.laws.length === 0) {
        	this.tableMessage = "Empty data"
        } else if (this.laws.length < this.totalElements) {
        	this.tableMessage = "Ready to load more rows ..."
        } else {
          this.tableMessage = ""  // All rows loaded from backend
        }
        console.log(query, " => ", this.laws.length)
        this.$refs.SearchTable.setRowData(this.laws)
        $('#loadingIcon').removeClass('fa-spin')
		})
		.catch(err => {
        	console.error("ERROR loading table data: ", err)
        	this.tableMessage = "Error loading table data!"
        	$('#loadingIcon').removeClass('fa-spin')
        	//$('#loadingIcon').addClass('loadingError')
      	})
	},

    /** Dynamically append additional rows to the bottom of the table */
    appendData(rowData) {
      if (rowData && rowData.length >= this.totalElements) {
        this.tableMessage = undefined
        return;      // all data is already loaded
      }
      //console.log("loading additional table data")
      this.tableMessage = "loading additional data ..."
      var query = this.getSearchQuery(rowData.length)
      this.$root.api.findByQuery(query).then(result => {
        var newLaws = result._embedded.laws
        this.totalElements = result.totalElements
        this.tableMessage = "ready to load more rows ..."
        this.$refs.SearchTable.appendRowData(newLaws)
      })
      .catch(err => { console.error("ERROR appending to search result: ", err) })

	},

	/** Set currentFilterValues from initial query (if any is passed) */
	handleInitQuery() {
		if (this.initQuery) {
			for (var filterId in this.initQuery) {
				switch (filterId) {
					case "areaId":
						//TODO:  BUGFIX Can only set area, AFTER area has been loaded. :-(
						this.$refs.tableFilter.setFilterValue("category", this.initQuery[filterId])			// set areaId. Area name will be set automatically
						break;
					case "textSearch":
						this.$refs.tableFilter.setFilterValue("textSearch", this.initQuery[filterId])   	// test seach has only one value
						break;
					case "statusList":
						this.$refs.tableFilter.setFilterValue("status", this.initQuery[filterId])   		// newDisplayValue of MulitSelect will be automatically calculated
						break;
					case "createdByYou":
						this.$refs.tableFilter.setFilterValue("createdByYou", this.initQuery[filterId])   	// newValue = true or false
						break;
				}
			}
			this.$nextTick(this.reloadFromServer)   // when new filter values have propagated through UI, then reload data from server
		} else {
			this.$refs.tableFilter.setFilterValue("status", ["IDEA"])   // This will trigger an immideate initial reload.  (Vue refs are only available in mounted and inside v-for they are arrays!)
		}

		this.listenToTableFilterChanges = true
	},

  },


  /**
   * Initially load users and categories for selects.
   * Filter for ideas by default. Load first set of ideas.
   */
  created() {
	this.debouncedReload = _.debounce(this.reloadFromServer, 1000)    // create debounced version of reloadFromServer function
	Promise.all([
		this.$root.api.getAllCategories(),
		this.$root.api.getAllUsers()
	])
	.then(([categories, users]) => {
	  this.filtersConfig[3].options = categories.map(cat => { return { value: cat.id, displayValue: cat.title } } )
	  this.filtersConfig[4].options = users.map(user => { return { value: user.email, displayValue: user.profile.name } } )
	})
	.then(this.handleInitQuery)   //handleInitQuery MUST be called, AFTER all filter options have been loaded
  },

  mounted() {

  },

  /** These are vue "filters". They convert the passed value into a format that shows to the user. (They should be called converters by vue.) */
  filters: {
	statusIcon(status) {
		switch(status) {
			case "IDEA": return '<i class="far fa-lightbulb"  aria-hidden="true"></i>'
			case "LAW":  return '<i class="fa  fa-university" aria-hidden="true"></i>'
		}
		return '<i class="fa fa-file-alt" aria-hidden="true"></i>'
	},

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
  #SearchTable tbody tr td:nth-child(2) {
    cursor: pointer;
  }
</style>
