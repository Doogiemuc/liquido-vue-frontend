<template>
<div class="container-fluid">
  <h1>Ideas</h1>
  <p class="lead">Spontaneous suggestions for improvement</p>
  <p>Here you can see all currently active ideas. If you want to support an idea, then click the button "Like to discuss this!" When an idea reaches at least NN supporters, then it is moved onto the table and can be voted upon.</p>

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
    :loading="ideasLoading"
    :show-add-button="false"
		:rowFilterFunc="rowFilterFunc"
    v-on:saveNewValue="saveNewValue"
    ref="ideatable"
  />
</div>

</template>

<script>
import DoogieTable from '../components/DoogieTable'
import DoogieFilter from '../components/DoogieFilter'
import SupportButton from  '../components/SupportButton'
import moment from 'moment'

/** compare user names of createdBy */
var createdByComparator = function(val1, val2) {
  return val1.createdBy.profile.name.localeCompare(val2.createdBy.profile.name, 'lookup', { numeric: true } );
}
//Cannot have these as data properties, cause they are initialized to late. Will be filled in reloadFromServer()
var allUsers = []
var allCategories = []

export default {
  data () {
    return {
      // Data for DoogieTable.vue
      ideaColumns: [
        { title: "Title", path: "title", editable: true },
        { title: "Description", path: "description", editable: false },
        { htmlTitle: '<i class="fa fa-user"></i>', path: "createdBy", vueFilter: 'userAvatar', rawHTML: true, comparator: createdByComparator },
        { htmlTitle: '<i class="fas fa-thumbs-up"></i>', path: "numSupporters", editComponent: SupportButton, editCompProps: { foo: 'bar' } },
        { htmlTitle: '<i class="fa fa-bookmark"></i>', path: "area.title", vueFilter: 'makeSmall', rawHTML: true },
        { title: "Created", path: "createdAt", vueFilter: 'localizeDateSmall', rawHTML: true },
        { title: "Last activity", path: "updatedAt", vueFilter: 'fromNowSmall', rawHTML: true },
      ],
      ideaKey: "_links.self.href",
      ideasLoading: true,
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
          options: allUsers
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

      ],
    }
  },

  components: {
    DoogieTable,
    DoogieFilter,
		SupportButton,
  },


  methods: {
    shownRowNumbers: function() {
      var table = this.$refs.ideatable
      if (!table) return "all"
      var first = table.page*table.rowsPerPage + 1
      var last  = (table.page+1)*table.rowsPerPage
      return first+"-"+last
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
			//console.log("rowFilterFunc", dateRange === undefined? "undefined" : this.$refs.ideaTableFilter.isInDateRange(row.updatedAt, dateRange))
			return (!currentFilters.searchID.value || (
          searchRegex.test(row.title) ||
          searchRegex.test(row.description) ||
          searchRegex.test(row.createdBy.email) ||
          searchRegex.test(row.createdBy.profile.name)
        )) &&
				(dateRange === undefined || this.$refs.ideaTableFilter.isInDateRange(row.updatedAt, dateRange)) &&   // row.updatedAt is a string!! ISO date format
				(categoryID === undefined || row.area.id == categoryID) &&
				(createdByID === undefined || row.createdBy.id == createdByID)
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
				allUsers.length = 0
				results[1].forEach(user => {
					allUsers.push({ value: user.id, displayValue: user.profile.name })
				})
				this.ideas = results[2]
				this.ideasLoading = false
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
