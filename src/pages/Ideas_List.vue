<template>
<div class="container-fluid">
  <h1>Ideas</h1>
  <p>An idea is a spontaneous suggestions for improvement. If you want to support an idea, then click the button "Like to discuss this!" When an idea reaches at least {{$root.props['liquido.supporters.for.proposal']}} supporters, then it is moved onto the table and can be discussed further. Click on an idea's title in the first column to navigate to that idea. You can use the filters to search for a specific idea.</p>


	<div class="row">
		<div class="col-sm-10">
	  	<doogie-filter
				:filtersConfig="filtersConfig"
				ref="ideaTableFilter"
				v-on:filtersChanged="filtersChanged"
			/>
    </div>
		<div class="col-sm-2 text-right">
		  <b>{{shownRowNumbers()}}</b> of <b>{{ideas.length}}</b>
      <span v-on:click="reloadFromServer" class="reloadIcon">
        <i class="fa fa-sync-alt" title="Reload table data from server" ></i>
      </span>
		</div>
	</div>

  <doogie-table
    :row-data="ideas"
    :columns="ideaColumns"
		:rowsPerPage="rowsPerPage"
    :primary-key-for-row="ideaKey"
    :message="ideasTableMessage"
    :show-add-button="false"
		:rowFilterFunc="rowFilterFunc"
    v-on:saveNewValue="saveNewValue"
    v-on:cellClicked="cellClicked"
    ref="ideatable"
  />
</div>

</template>

<script>
import DoogieTable from '../components/DoogieTable'
import DoogieFilter from '../components/DoogieFilter'
import TableSupportButton from  '../components/TableSupportButton'
import moment from 'moment'

/** compare user names of createdBy */
var createdByComparator = function(val1, val2) {
  return val1.createdBy.profile.name.localeCompare(val2.createdBy.profile.name, 'lookup', { numeric: true } );
}
//Cannot have these as data properties, cause they are initialized to late. Will be filled in reloadFromServer()
var allUsersOptions = []
var allCategories = []


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
        { title: "Title", path: "title", editable: false, vueFilter: 'titleLink', rawHTML: true },

        //TODO: Description contains HTML.   Show a small exerpt? Or Remove HTML tags?
        { title: "Description", path: "description", editable: false },

        { htmlTitle: '<i class="fa fa-user"></i>', path: "createdBy", vueFilter: 'userAvatar', rawHTML: true, comparator: createdByComparator },
        { htmlTitle: '<i class="fas fa-thumbs-up"></i>',
				  path: "numSupporters",
					editComponent: TableSupportButton,
					editCompProps: {
            supporterAdded: this.supporterAdded
          }
				},
        { htmlTitle: '<i class="fa fa-bookmark"></i>', path: "area.title", vueFilter: 'makeSmall', rawHTML: true },
        { title: "Created", path: "createdAt", vueFilter: 'localizeDateSmall', rawHTML: true },
        { title: "Last activity", path: "updatedAt", vueFilter: 'fromNowSmall', rawHTML: true },
      ],
      ideaKey: "_links.self.href",
      ideasTableMessage: "loading ...",
      ideas: [],
			rowsPerPage: 20,

			// data for DoogieFilter.vue
			filtersConfig: [
        {
          type: "search",
          id: "searchID",
          displayName: "Free text search"
        },
        {
          type: "dateRange",
          id: "updatedAtID",
          displayName: "Updated"
        },
        {
          type: "select",
          id: "categoryID",
          displayName: "Category",
          options: allCategories
        },
        {
          type: "selectWithSearch",
          id: "createdByID",
          displayName: "Created by",
          options: allUsersOptions
        },
        /*
        {
          type: "multi",
          id: "multiSelectID",
          displayName: "Multi Select",
          options: [
            { value: 'A', displayValue: "AAA" },
            { value: 'B', displayValue: "BBB" },
            { value: 'C', displayValue: "CCC" }
          ],
        },
        */
        {
          type: "quickFilter",
          id: "myIdeas",
          displayName: "My Ideas",
          onToggle: function(filter, active) {
            if (active) {
              var currentUser = this.$root.currentUser
              //"this" is the DoogieFilter.vue component here
              //But I cannot just simply call this.setFilterValue({id:'createdByID'}, currentUser.profile.name, currentUser.id)
              this.$refs.createdByID[0].setFilterValue(currentUser.profile.name, currentUser.id)
            } else {
              this.$refs.createdByID[0].clearSelectFilter()
            }
          },
        },
        {
          type: "quickFilter",
          id: "supportedByCurrentUser",
          displayName: "Supported by you",
        }

      ],
    }
  },

  methods: {
    /**
     * Which rows are currently shown
     */
     shownRowNumbers: function() {
      var table = this.$refs.ideatable
      if (!table) return "all"
      var numFilterdRows = table.getFilteredRowData.length
      var first = table.page*table.rowsPerPage + 1
      var last  = Math.min((table.page+1)*table.rowsPerPage, numFilterdRows)
      return first+"-"+last+"/"+table.getFilteredRowData.length
    },

    /**
     * save an updated value of an Idea
     * This is called when the EditableCell component fires the "saveNewValue" event
     * @param {String} ideaURI the full ideaURI which shall be updated (which is the rowId in IdeaTable!)
     * @param {Object} column Which column has been edited.
     * @param {Any} value The new value that the user has entered or chosen. As returned by the EditableCell component.
     */
    saveNewValue(ideaURI, column, value) {
      console.log("saveNewValue event in IdeasPage.vue:", ideaURI, column, value);
      var patchedIdea = {}
      patchedIdea[column.path] = value    // only send the updated key, e.g. { title: "new title" } in a PATCH request
      this.$root.api.patch(ideaURI, patchedIdea)
    },

		/**
     * Called when the advanced filters above the table changed.
     * @param {object} newFilters the new filter configuration
     */
		filtersChanged(newFilters) {
			//console.log("ideaTable.FiltersChanged", newFilters)
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
            title: 'OK',
            message: 'Thank you for supporting this idea.',
        });
      })

		},

    cellClicked(idea, col) {
      if (col.path === "title") { this.$router.push('/ideas/'+idea.id) }
    },

    /**
     * Fast client side filtering of table rows
     * This reactive function will automatically be called, when currentFilters changes.
     * @param {Object} row  one row from tableData
     * @return true when this row shall be shown according to the currentFilters
     */
		rowFilterFunc(row) {
			var currentFilters = this.$refs.ideaTableFilter.currentFilters
      var searchRegex = new RegExp(currentFilters.searchID.value, "i")
   		var dateRange   = currentFilters.updatedAtID.value  	// dateRange == {start: ..., end: ... }
			var categoryID  = currentFilters.categoryID.value
			var createdByID = currentFilters.createdByID.value
      var supported   = currentFilters.supportedByCurrentUser.value
			//console.log("rowFilterFunc", dateRange === undefined? "undefined" : this.$refs.ideaTableFilter.isInDateRange(row.updatedAt, dateRange))
			return (!currentFilters.searchID.value || (
          searchRegex.test(row.title) ||
          searchRegex.test(row.description) ||
          searchRegex.test(row.createdBy.email) ||
          searchRegex.test(row.createdBy.profile.name)
        )) &&
				(dateRange === undefined || this.$refs.ideaTableFilter.isInDateRange(row.updatedAt, dateRange)) &&   // row.updatedAt is a string!! ISO date format
				(categoryID === undefined || row.area.id == categoryID) &&
				(createdByID === undefined || row.createdBy.id == createdByID) &&
        (supported === false || row.supportedByCurrentUser === true)
		},

    /**
     * (re)load all tabledata from the server. Cache will temporarily be disabled for this.
     */
		reloadFromServer() {
			this.$root.api.disableCache()
			Promise.all([
				this.$root.api.getAllCategories(),
				this.$root.api.getAllUsers(),
				this.$root.api.findByStatus("IDEA", 0, 1000, "updatedAt,desc")
			]).then(results => {
				// must push into existing array. Cannot simply assign new array, cause Vue will not recognize this as reactive property
				allCategories.length = 0
				results[0].forEach(category => {
					allCategories.push({ value: category.id, displayValue: category.title })
				})
				allUsersOptions.length = 0
				results[1].forEach(user => {
					allUsersOptions.push({ value: user.id, displayValue: user.profile.name })
				})
				this.ideas = results[2]
				this.ideasTableMessage = undefined
				this.$root.api.enableCache()
			})
			.catch(err => { console.log("ERROR loading data for ideasPage: ", err) })

		},

  },

  created () {
		this.reloadFromServer()
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
    }
  },

}
</script>

<style>
  .reloadIcon {
    cursor: pointer;
  }
</style>
