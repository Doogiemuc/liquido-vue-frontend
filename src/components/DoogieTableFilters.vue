<template>
	<div class="filtersOuterWrapper">
    <div v-for="filter in filtersConfig" class="filterWrapper">

      <div v-if="filter.type === 'search'">
        <!-- Free text (google like)  search -->
        <input type="text" class="searchInput" :id="filter.id" :name="filter.id" :placeholder="filter.name" v-model="currentFilters[filter.id].value"/>
      </div>

      <div v-else-if="filter.type === 'dateRange'" class="btn-group">
        <button type="button" class="btn btn-xs dropdown-toggle" :class="getActiveClass(filter.id)" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
          {{filter.name}}: {{currentFilters[filter.id].displayValue}} <span class="caret"></span>
        </button>
        <ul class="dropdown-menu">
          <li><a v-on:click="setDateRangeToPastDays(filter, 0)">Today</a></li>
          <li><a v-on:click="setDateRangeToPastDays(filter, 7)">Last 7 days</a></li>
          <li><a v-on:click="setDateRangeToPastDays(filter, 14)">Last 14 days</a></li>
          <li role="separator" class="selectDivider"></li>
          <li><button type="button" class="btn btn-default btn-xs clearButton" v-on:click="setFilterValue(filter.id, 'Anytime', undefined)">Clear</button></li>
        </ul>
       </div>

      <div v-else-if="filter.type === 'select'" class="btn-group">
        <!-- Select for exactly one value -->
        <button type="button" class="btn btn-xs dropdown-toggle" :class="getActiveClass(filter.id)" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
          {{filter.name}}: {{currentFilters[filter.id].displayValue}} <span class="caret"></span>
        </button>
        <ul class="dropdown-menu">
          <li v-for="option in filter.options"><a class="selectItem" v-on:click="setFilterValue(filter.id, option.displayValue, option.value)">{{option.displayValue}}</a></li>
          <li role="separator" class="selectDivider"></li>
					<li><button type="button" class="btn btn-default btn-xs clearButton" v-on:click="setFilterValue(filter.id, 'Any', undefined)">Clear</button></li>
        </ul>
      </div>

      <div v-else-if="filter.type === 'multi'" class="btn-group">
        <!-- select for multiple values. With checkboxes -->
        <button type="button" class="btn btn-xs dropdown-toggle" :class="getActiveClass(filter.id)" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
          {{filter.name}}: {{currentFilters[filter.id].displayValue}} <span class="caret"></span>
        </button>
        <div class="dropdown-menu">
          <ul class="selectList">
            <li v-for="option in filter.options"><input type="checkbox" :value="option.value" v-model="selectedCheckboxes[filter.id]"/>&nbsp;{{option.displayValue || option.value}}</li>
          </ul>
          <div role="separator" class="selectDivider"></div>
          <button type="button" class="btn btn-primary btn-xs applyButton" v-on:click="applyMultiSelect(filter, selectedCheckboxes[filter.id])">Apply</button>
          <button type="button" class="btn btn-default btn-xs clearButton" v-on:click="clearMultiSelect(filter)">Clear</button>
        </div>
      </div>

      <component v-else-if="filter.type === 'selectWithSearch'"
        :is="filter.type"
        :id="filter.id"
        :name="filter.name"
        :options="filter.options"
        v-model="currentFilters[filter.id]"
        ></component>

			<!-- doogie-filter-select v-else-if="filter.type === 'selectWithSearch'"
			  :id="filter.id"
        :ref="filter.id"
				:name="filter.name"
				:options="filter.options"
				v-model="currentFilters[filter.id].value"
			/ -->

      <div v-else-if="filter.type === 'toggle'">
        <button type="button" class="btn btn-xs btn-default" :class="getActiveClass(filter.id)" @click="toggle(filter.id)">{{filter.name}}</button>
      </div>

    </div>

    <small><a href="" v-on:click.prevent="clearAllFilters">Clear all filters</a></small>

  </div>
</template>

<script>

import selectWithSearch from '../components/filter/SelectWithSearchFilter'

/**
 * Filter functionality for rows in DoogieTable.
 * Do not confuse this with Vue's "filters" !!! Vue's filters are for string conversion in vue templates, e.g. {{ value | capitalize }}
 * And by the way they should be called converters by Vue.
 *
 * This component offers powerfull filters that can be dynamically be combined. Maybe you know the filters of JIRA.
 */
export default {
  props: {
    /*
      Array of configoration info for each filter.
      Filtes will be shown in this order.

      Example:

      filtersConfig: [
        {
          type: "search",
          id: "searchID",
          name: "Free text search"
        },
        {
          type: "dateRange",
          id: "updatedAtID",
          name: "Updated"
        },
        {
          type: "select",
          id: "categoryID",
          name: "Category",
          options: allCategories
        },
        {                       // TODO: for DoogieFilter.vue: buttonGroup where one or multiple buttons can be selected
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
        // A select drop down with a (possibly very long) list of values and a search input field for those values
        {
          type: "selectWithSearch",
          id: "createdByID",
          name: "Created by",
          options: allUsers
        },
        // A toggle is just an ON/OFF toggle button. It's a quick way to filter the table in a pre defined way.
        // A toggle might also be a preset for some of the other filters
        {
          type: "toggle",
          id: "myIdeas",
          name: "My Ideas",
          onChange: function(filter, active) {
            if (active) {
              var currentUser = this.$root.currentUser
              //"this" is the DoogieFilter.vue component here
              //But I cannot just simply call this.setFilterValue('createdByID', currentUser.profile.name, currentUser.id)
              this.$refs.createdByID[0].setFilterValue(currentUser.profile.name, currentUser.id)

            } else {
              this.$refs.createdByID[0].clearFilter()
            }
          },
      }
    */
    filtersConfig: { type: Array, required: true },
  },

  components: {
    selectWithSearch
  },

  /**
   * currentFilters will be built from filtersConfig in initFilters()
   * For each filter it contains
   * - displaValue: the text to show to the user, e.g. "Any".  Do not confuse this with the filterConfig.name!
   * - value: the internal value of the filter, e.g. false, a string or a date
   */
  data () {
    return {
      filterConfigsById: {},    // the filtersConfig array as an object with filter.ids as keys
      currentFilters: {},       // current values of all applied filters.
			selectedCheckboxes: {}		// temp storage for selected checkboxes of "multi" selects
    }
  },

  watch: {
    // This object will contain the currently selected values for each filter.
    // Inactive filters will normally have the value null. But there are exceptions: Unselected multi will have the value []
    currentFilters: {
			//TODO: _.debounce(function() {...}, 500)   // only trigger the event after a min of 500 secs
      handler: function(newFilters) {
        console.log("currentFilters change handler")
				console.log("to", JSON.stringify(newFilters))
				this.$emit('filtersChanged', newFilters)
      },
      deep: true
    }
  },

  computed: {

  },

  methods: {
    /**
     * set the value of one filter
     * @param {String} filterId of one element from your filtersConfig array
     * @param {String} newDisplayValue how the new value shall be shown to the user
     * @param {any} newValue the new value that will be saved in this.currentFilters[fiter.id].value
     */
    setFilterValue(filterId, newDisplayValue, newValue, preventOnChangeEvent) {
      if (!this.filterConfigsById[filterId]) throw new Error("Don't know any filter with id"+filterId)

			console.log("setFilterValue(filter.id="+filterId+", newDisplayValue='"+newDisplayValue+"', newValue=", newValue)

			this.currentFilters[filterId].displayValue = newDisplayValue
      this.currentFilters[filterId].value = newValue

      // If filterId is a child component (as with DoogieFilterSelect) then also call its setFilterValue method
      if (this.$refs[filterId]) {
        console.log("Setting value in ", this.$refs[filterId][0])           // this v-ref is an array, because its used inside a v-for
        this.$refs[filterId][0].setFilterValue(newDisplayValue, newValue)
      }
			//if filter has an onChange handler, then call it
			if (typeof this.filterConfigsById[filterId].onChange === "function" && !preventOnChangeEvent) {
				this.filterConfigsById[filterId].onChange.call(this, this.filterConfigsById[filterId], newDisplayValue, newValue)
			}
    },

    // "Points in time in the universe and our names for them. I'll never understand why we humans have such great problems with the concept of time." (R.Rackl 2018)
    /**
     * Set a date range between nDays in the past and (end of) today.
     * newValue will be set to { from: <date nDays in the past>, until: <end of today> }
     * @param {Object} filter One element from filtersConfig array
     * @param {integer} nDays number of days to go into the past
     */
    setDateRangeToPastDays(filter, nDays) {
      var newDisplayValue = nDays == 0 ? "Today" : "Last "+nDays+" days"
      var newValue = {}
      var start = new Date()
      start.setHours(0,0,0,0)         // start of the first day at midnight
      newValue.start = new Date(start.getTime() - nDays*24*3600*1000)    // n days in the past
      var end = new Date()
      end.setHours(23,59,59,999)
      newValue.end = end
      this.setFilterValue(filter.id, newDisplayValue, newValue)
    },

    //TODO: datePicker for date ranges. But as a component equal to DoogieFilterSelect

		/**
		 * @param {object|string|number} date Can be passed as JS Date object, ISO date string or number of milliseconds
		 * @param {object} dateRange {start: <date>, end: <date> }    Keep in mind that JS dates are actually datetime.
		 * @return true, when date is within dateRange.start and dateRange.end
		 */
		isInDateRange(date, dateRange) {
			date = new Date(date)  // allow everything new Date is able to parse,  e.g. ISO strings
			//console.log("isInDateRange", date, dateRange, dateRange.start <= date && date <= dateRange.end)
			return dateRange.start <= date && date <= dateRange.end
		},

    /**
     * Set the value of a multi select.
     * @param {Object} filter The filter object from your filtersConfig array
     * @param {array} values array with 'option.values' of all selected checkboxes
     */
    applyMultiSelect(filter, values) {
      if (!Array.isArray(values)) throw new Error("Need array of values in applyMultiSelect!")
      var displayValue = ""
      // non selected: show "Any"
      // all selected: show "All"
      // one selected: show its display name
      // two selected: show their two display values  (if they have displayValues)
      // more selected: show e.g. "2/5"
      if (values.length == filter.options.length) {
        displayValue = 'All'
      } else if (values.length == 1) {
        var selectedOption = filter.options.find((option) => option.value == values[0])
        displayValue = selectedOption ? selectedOption.displayValue : "1/"+filter.options.length
      } else if (values.length == 2) {
        var selectedOption1 = filter.options.find((option) => option.value == values[0])
        var selectedOption2 = filter.options.find((option) => option.value == values[1])
        displayValue = selectedOption1 && selectedOption2 ? (selectedOption1.displayValue+","+selectedOption2.displayValue) : "2/"+filter.options.length
      } else {
        displayValue = values.length  +'/'+filter.options.length
      }
      this.setFilterValue(filter.id, displayValue, values)
      this.selectedCheckboxes[filter.id] = values  // when called from outside, also update selected checkboxes with new values
    },

    /**
     * Set all checkboxes of a multi select to unselected
     * @param {Object} filter One element from filtersConfig array
     */
    clearMultiSelect(filter) {
      this.selectedCheckboxes[filter.id] = []
      this.setFilterValue(filter.id, 'Any', [])
    },

    /** Switch a toggle on and off */
    toggle(filterId) {
      var newValue = !this.currentFilters[filterId].value
      this.setFilterValue(filterId, newValue, newValue)
    },

		/** Clear the value of one filter */
		clearFilter(filterId) {
			if (!this.filterConfigsById[filterId]) throw new Error("Don't know any filter with id="+filterId)
			switch (this.filterConfigsById[filterId].type) {
				case "search":
					this.$set(this.currentFilters[filterId], 'displayValue', "")   // For a search input value == displayValue :-)
					this.$set(this.currentFilters[filterId], 'value', undefined)
					break;
				case "dateRange":
					this.$set(this.currentFilters[filterId], 'displayValue', "Anytime")
					this.$set(this.currentFilters[filterId], 'value', undefined)
					break;
				case "select":
					this.$set(this.currentFilters[filterId], 'displayValue', "Any")
					this.$set(this.currentFilters[filterId], 'value', undefined)
					break;
				case "selectWithSearch":
					if (this.$refs[filterId])                        // Vue ref are not yet filled during initial render
						this.$refs[filterId][0].clearFilter()          // $refs returns an array when used inside for loop.
					break;
				case "multi":
					this.$set(this.currentFilters[filterId], 'displayValue', "Any")
					this.$set(this.currentFilters[filterId], 'value', [])    // The 'value' of a multi is an Array of currently selected option.values
					this.selectedCheckboxes[filterId] = []
					break;
				case "toggle":
					this.$set(this.currentFilters[filterId], 'value', false)
					break;
      }
		},

    /**
      Init currentFilters according to filtersConfig. Set default values.
      This needs to be done through Vue's $set() method, so that deep changes in the object can be detected by Vue. And the {{templates}} in our view will be updated.
      See https://vuejs.org/v2/guide/reactivity.html#ad
    */
    clearAllFilters() {
      this.filtersConfig.forEach(filter => {
        this.filterConfigsById[filter.id] = filter
        this.$set(this.currentFilters, filter.id, {})
				this.clearFilter(filter.id)
      })
    },

    /** When a filter is active, then style it accordingly */
    getActiveClass(filterId) {
      var filterCleared = this.currentFilters[filterId].value === undefined || this.currentFilters[filterId].value === "" || this.currentFilters[filterId].value === false || this.currentFilters[filterId].value.length == 0
      return {
        'btn-default': filterCleared,
        'btn-primary': !filterCleared
      }
    }

  },

  created () {
		this.currentFilters = {}
    this.clearAllFilters()
  }
}
</script>

<style scoped>
  .filtersOuterWrapper {
		margin-bottom: 5px;
  }
  .filterWrapper {
    display: inline-block;
		vertical-align: top;
  }
  .filterWrapper:not(:first-child) {
    margin-left: 5px;
  }

  .searchInput {
    display: inline-block;
    height: 22px;
    padding-left: 5px;
    border: 1px solid #ccc;
    border-radius: 4px;
  }

  /* Select list with search input */
  .selectSearchInput {
    border: none;
    margin-left: 5px;
    margin-right: 5px;
    margin-bottom: 0px;
  }
  .selectDivider {
    height: 1px;
    margin: 5px 0;
    overflow: hidden;
    background-color: #e5e5e5;
  }
  .selectListWrapper {
    max-height: 400px;
    overflow-y: scroll;
  }
  .selectList {
    list-style: none;
    -webkit-padding-start: 06px;
  }
	.selectItem {
		padding-top: 0;
		padding-bottom: 0;
	}
  .selectList li:hover {
    background-color: #f5f5f5;
    cursor: pointer;
  }

  .applyButton {
    margin-left: 5px;
  }
  .clearButton {
    float: right;
    margin-right: 5px;
  }


</style>

