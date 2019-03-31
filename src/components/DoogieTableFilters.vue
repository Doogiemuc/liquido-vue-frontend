<template>
	<div class="filtersOuterWrapper">
    <div v-for="filter in filtersConfig" class="filterWrapper">

      <!-- Vue component for this filter. Automatically bind all filter attributes to child component. Required is id.  Most filters require a single 'value' or an 'options' array -->
      <component
        :is="filter.type"
        :ref="filter.id"
        v-bind="filter"
        v-model="currentFilters[filter.id]">
      </component>

    </div>

    <small><a href="#" @click="clearAllFilters">Clear all filters</a></small>

  </div>
</template>

<script>

import selectWithSearch from '../components/filter/SelectWithSearchFilter'
import textSearch from '../components/filter/TextSearchFilter'
import dateRange from '../components/filter/DateRangeFilter'
import singleSelect from '../components/filter/SingleSelectFilter'
import multiSelect from '../components/filter/MultiSelectFilter'
import toggleButton from '../components/filter/toggleButtonFilter'

/**
 * Filter functionality for rows in DoogieTable.
 * Do not confuse this with Vue's "filters" !!! Vue's filters are for string conversion in vue templates, e.g. {{ value | capitalize }}
 * And by the way they should be called converters by Vue.
 *
 * This component offers powerfull filters that can be dynamically be combined. Maybe you know the filters of JIRA.
 */
export default {
  props: {
    filtersConfig: { type: Array, required: true, validator: function(arr) {
      return arr.every(elem => {
        var valid = ['textSearch', 'singleSelect', 'multiSelect', 'selectWithSearch', 'dateRange', 'toggleButton'].indexOf(elem.type) !== -1
        if (!valid) console.warn("Unknown filter.type '"+elem.type+"'")
        return valid
      })
    }},
  },

  components: {
    textSearch,
    singleSelect,
    multiSelect,
    selectWithSearch,
    dateRange,
    toggleButton,
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




		/**
      Clear the value of afilter
      This needs to be done through Vue's $set() method, so that deep changes in the object can be detected by Vue. And the {{templates}} in our view will be updated.
      See https://vuejs.org/v2/guide/reactivity.html#ad
     */
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
    */
    clearAllFilters() {
      /*
      this.filtersConfig.forEach(filter => {
				this.clearFilter(filter.id)
      })
      */
    },

  },

  created () {
    this.filtersConfig.forEach(filter => {
      this.filterConfigsById[filter.id] = filter
    })
  },

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
</style>

