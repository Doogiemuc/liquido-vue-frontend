<template>
	<div class="filtersOuterWrapper">
    <div v-for="filter in filtersConfig" class="filterWrapper">

      <div v-if="filter.type === 'search'">
        <!-- Free text (google like)  search -->
        <input type="text" class="searchInput" :id="filter.name" :name="filter.name" :placeholder="filter.displayName" v-model="currentFilters[filter.id].value"/>
      </div>

      <div v-else-if="filter.type === 'dateRange'" class="btn-group">
        <button type="button" class="btn btn-default btn-xs dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
          {{filter.displayName}}: {{currentFilters[filter.id].displayValue}} <span class="caret"></span>
        </button>
        <ul class="dropdown-menu">
          <li><a v-on:click="setDateRangeToPastDays(filter, 0)">Today</a></li>
          <li><a v-on:click="setDateRangeToPastDays(filter, 7)">Last 7 days</a></li>
          <li><a v-on:click="setDateRangeToPastDays(filter, 14)">Last 14 days</a></li>
          <li role="separator" class="selectDivider"></li>
          <li><button type="button" class="btn btn-default btn-xs clearButton" v-on:click="setFilterValue(filter, 'Anytime', undefined)">Clear</button></li>
        </ul>
      </div>

      <div v-else-if="filter.type === 'select'" class="btn-group">
        <!-- Select for exactly one value -->
        <button type="button" class="btn btn-default btn-xs dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
          {{filter.displayName}}: {{currentFilters[filter.id].displayValue}} <span class="caret"></span>
        </button>
        <ul class="dropdown-menu">
          <li v-for="option in filter.options"><a class="selectItem" v-on:click="setFilterValue(filter, option.displayValue, option.value)">{{option.displayValue}}</a></li>
          <li role="separator" class="selectDivider"></li>
					<li><button type="button" class="btn btn-default btn-xs clearButton" v-on:click="setFilterValue(filter, 'Any', undefined)">Clear</button></li>
        </ul>
      </div>

      <div v-else-if="filter.type === 'multi'" class="btn-group">
        <!-- select for multiple values. With checkboxes -->
        <button type="button" class="btn btn-default btn-xs dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
          {{filter.displayName}}: {{currentFilters[filter.id].displayValue}} <span class="caret"></span>
        </button>
        <div class="dropdown-menu">
          <ul class="selectList">
            <li v-for="option in filter.options"><input type="checkbox" :value="option.value" v-model="selectedCheckboxes[filter.id]"/>&nbsp;{{option.displayValue}}</li>
          </ul>
          <div role="separator" class="selectDivider"></div>
          <button type="button" class="btn btn-primary btn-xs applyButton" v-on:click="applyMultiSelect(filter, selectedCheckboxes[filter.id])">Apply</button>
          <button type="button" class="btn btn-default btn-xs clearButton" v-on:click="clearMultiSelect(filter)">Clear</button>
        </div>
      </div>
			
			<doogie-filter-select v-if="filter.type === 'selectWithSearch'"
			  :id="filter.id"
				:displayName="filter.displayName"
				:options="filter.options"
				v-model="currentFilters[filter.id]"
			/>

    </div>

    <small><a href="" v-on:click.prevent="clearAllFilters">Clear all filters</a></small>
		
  </div>
</template>

<script>

import DoogieFilterSelect from '../components/DoogieFilterSelect'

export default {
  props: {
    // Array of configoration info for each filter, eg. [ { type: "dateRange", name: "Created at"  }, { ... } ]
    filtersConfig: { type: Array, required: true },
  },

  components: {
    DoogieFilterSelect
  },

  data () {
    return {
      currentFilters: {},       // current values of all applied filters.
			selectedCheckboxes: {}		// temp storage for selected checkboxes of "multi" select 
    }
  },

  watch: {
    // This object will contain the currently selected values for each filter.
    // Inactive filters will normally have the value null. But there are exceptions: Unselected multi will have the value []
    currentFilters: {
      handler: function(newFilters, oldFilters) {
				this.$emit('filtersChanged', newFilters)
      },
      deep: true
    }
  },
  
  methods: {
    /**
     * set the value of one filter
     * @param {Object} filter One element from filtersConfig array
     * @param {String} newDisplayValue how the new value shall be shown to the user
     * @param {any} newValue the new value that will be saved in this.currentFilters[fiter.id].value
     */
    setFilterValue(filter, newDisplayValue, newValue) {
      this.currentFilters[filter.id].displayValue = newDisplayValue
      this.currentFilters[filter.id].value = newValue
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
      this.setFilterValue(filter, newDisplayValue, newValue)
    },

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
     * newValue will be an array with the ids of all selected checkboxes
     * @param {Object} filter One element from filtersConfig array
     * @param {array} selectedCheckboxes array with ids to all selected checkboxes
     */
    applyMultiSelect(filter) {
      var displayValue = this.selectedCheckboxes[filter.id].length == filter.options.length ? 'All' : this.selectedCheckboxes[filter.id].length+'/'+filter.options.length+' selected'
      this.setFilterValue(filter, displayValue, this.selectedCheckboxes[filter.id])
    },

    /**
     * Set all checkboxes of a multi select to unselected 
     * @param {Object} filter One element from filtersConfig array
     */
    clearMultiSelect(filter) {
      this.selectedCheckboxes[filter.id] = []
      this.setFilterValue(filter, 'Any', [])
    },

    /**
      Init currentFilters according to filtersConfig. Set default values.
      This needs to be done through Vue's $set() method, so that deep changes in the object can be detected by Vue. And the {{templates}} in our view will be updated.
      See https://vuejs.org/v2/guide/reactivity.html#ad
    */
    initFilters() {
      this.currentFilters = {}
      this.filtersConfig.forEach(filter => {
        this.$set(this.currentFilters, filter.id, {})
        switch (filter.type) {
          case "search":
            //this.$set(this.currentFilters[filter.id], 'displayValue', "")    For a search input value == displayValue :-)
            this.$set(this.currentFilters[filter.id], 'value', "")
            break;
          case "dateRange":
            this.$set(this.currentFilters[filter.id], 'displayValue', "Anytime")
            this.$set(this.currentFilters[filter.id], 'value', undefined)
            break;
          case "select":
            this.$set(this.currentFilters[filter.id], 'displayValue', "Any")
            this.$set(this.currentFilters[filter.id], 'value', undefined)
            break;
          case "selectWithSearch":
            break;
          case "multi":
            this.$set(this.currentFilters[filter.id], 'displayValue', "Any")
            this.$set(this.currentFilters[filter.id], 'value', [])    // Array is needed for Vue's handling of checkboxes
            this.selectedCheckboxes[filter.id] = []  
            break;
        }
      })
    },

    clearAllFilters() {
      this.initFilters()
    },    

  },

  created () {
    this.initFilters()
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

