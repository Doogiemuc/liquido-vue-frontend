<template>
<div class="container-fluid">
  <h1>Search for Ideas, Proposals and Laws</h1>

	<div>
    <div class="pull-right">
      {{ideas.length}}&nbsp;of&nbsp;{{totalElements}}&nbsp;
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
    :row-data="ideas"
    :columns="ideaColumns"
    :fixedRowHeight="80"
    :primary-key-for-row="ideaKey"
    :message="tableMessage"
    :show-add-button="false"
		:rowFilterFunc="undefined"
    v-on:saveNewValue="saveNewValue"
    v-on:sortingChanged="sortingChanged"
    v-on:cellClicked="cellClicked"
    ref="ideatable"
    id="ideatable"
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
      ideaColumns: [
        { title: "Title", path: "title", editable: false, vueFilter: 'titleLink', rawHTML: false },
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
      ideaKey: "_links.self.href",
      tableMessage: "loading ...",

      ideas: [],
      totalElements: 0,   // total number of rows as returned by backend
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
          options: []
        },
        {
          type: "toggle",
          id: "myIdeas",
          name: "My Ideas",
          onToggle: function(filter, active) {
            if (active) {
              var currentUser = this.$root.currentUser
              // When "My Ideas" is clicked, then also set the value of the other CreatedBy filter
              //"this" is the DoogieFilter.vue component here
              //But I cannot just simply call this.setFilterValue({id:'createdByID'}, currentUser.profile.name, currentUser.id)
              //TODO: BUGFIX. I think I misses the first parameter hier. this.setFilter({id: "createdById"}, currentUser.profile.name, currentUser.id)  should work.
              console.log(this)
              this.$refs.createdByID[0].setFilterValue(currentUser.profile.name, currentUser.id)
            } else {
              this.$refs.createdByID[0].clearSelectFilter()
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
    getSearchQuery() {
      var query = { }
      if (!this.$refs || !this.$refs.tableFilter || !this.$refs.tableFilter.currentFilters) return query

      var f = this.$refs.tableFilter.currentFilters
      if (f.statusID.value && f.statusID.value.length >= 1) {
        query.statusList = f.statusID.value  // array of status
      }
      if (f.categoryID.value) {
        query.areaId = f.categoryID.value
      }
      if (f.createdByID.value) {
        query.createdByEmail = f.createdByID.value
      }
      if (f.updatedAtID.value) {
        query.updatedAfter = f.updatedAtID.value.start
        query.updatedBefore = f.updatedAtID.value.end
      }
      if (f.supportedByCurrentUser.value) {
        query.supportedByEMail = currentUser.profile.email
      }

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
     * @param {String} ideaURI the full ideaURI which shall be updated (which is the rowId in IdeaTable!)
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
     * Called when the advanced filters above the table changed.
     * @param {object} newFilters the new filter configuration
     */
		filtersChanged(newFilters) {
			//console.log("Search.filtersChanged", newFilters)
      this.reloadFromServer()
		},

    sortingChanged(sortByCol, sortOrder) {
      //console.log("ideaTable.sortingChanged", sortByCol, sortOrder)
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
        //update local values by hand
        //var index = this.$refs.ideatable.getIndexOf(idea)
        //this.ideas[index].numSupporters   has already been incremented by SupportButton
        //this.ideas[index].supportedByCurrentUser = true

        //OLD: reload idea completely from server
        //this.$root.api.getIdea(idea, true).then(reloadedIdea => {
        //  this.$set(this.ideas, index, reloadedIdea)  // Important: Must use Vue's reactive $setter when replacing an array element
        //})

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
     * Fast client side filtering of table rows
     * This reactive function will automatically be called, when currentFilters changes.
     * @param {Object} row  one row from tableData
     * @return true when this row shall be shown according to the currentFilters
     */
		rowFilterFunc(row) {
			var currentFilters = this.$refs.tableFilter.currentFilters
      console.log(this.$refs.tableFilter.currentFilters)
      var searchRegex = new RegExp(currentFilters.searchID.value, "i")
   		var dateRange   = currentFilters.updatedAtID.value  	// dateRange == {start: ..., end: ... }
			var categoryID  = currentFilters.categoryID.value
			var createdByID = currentFilters.createdByID.value
      var supported   = currentFilters.supportedByCurrentUser.value
			//console.log("rowFilterFunc", dateRange === undefined? "undefined" : this.$refs.tableFilter.isInDateRange(row.updatedAt, dateRange))
			return (!currentFilters.searchID.value || (
          searchRegex.test(row.title) ||
          searchRegex.test(row.description) ||
          searchRegex.test(row.createdBy.email) ||
          searchRegex.test(row.createdBy.profile.name)
        )) &&
				(dateRange === undefined || this.$refs.tableFilter.isInDateRange(row.updatedAt, dateRange)) &&   // row.updatedAt is a string!! ISO date format
				(categoryID === undefined || row.area.id == categoryID) &&
				(createdByID === undefined || row.createdBy.id == createdByID) &&
        (supported === false || row.supportedByCurrentUser === true)
		},

    /**
     * Reload (filtered) tabledata from the server.
     */
		reloadFromServer() {
      this.tableMessage = "loading ..."
      var query = this.getSearchQuery()
      this.$root.api.findByQuery(query).then(result => {
				this.ideas = result._embedded.laws
        this.totalElements = result.page.totalElements
				this.tableMessage = undefined
			})
			.catch(err => { console.log("ERROR loading data for ideasPage: ", err) })
		},

  },

  /**
   * Initially load users and categories for selects.
   * Filter for ideas by default. Load first set of ideas.
   */
  mounted () {
    this.$root.api.getAllCategories().then(categories => {
      this.filtersConfig[3].options = categories.map(cat => { return { value: cat.id, displayValue: cat.title } } )
    })
    this.$root.api.getAllUsers().then(users => {
      this.filtersConfig[4].options = users.map(user => { return { value: user.profile.email, displayValue: user.profile.name } } )
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
  #ideatable tbody tr td:nth-child(2) {
    cursor: pointer;
  }
</style>
