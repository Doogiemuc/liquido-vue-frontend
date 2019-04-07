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
        if (!valid) console.error("Unknown filter.type '"+elem.type+"'")
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

  data () {
    return {
      filterConfigsById: {},    // the filtersConfig array mapped to an object with filter.ids as keys
      currentFilters: {},       // { filterID: value, ... } for all active filters. Contains only IDs and values. Not andy displayNames.
    }
  },

  watch: {
    /**
      When any filter changes then emit an 'tableFiltersChanged' event. There are also 'filterChanged' events for each individual filter.
      You might want to listen to this and then (debounced) reload your table data.
     */
    currentFilters: {
      handler: function(newFilters) {
				this.$emit('tableFiltersChanged', newFilters)
      },
      deep: true
    }
  },

  methods: {
    /**
     * Set the value of one filter. This will fire the filterChanged event.
     * @param {String} filterId of one element from your filtersConfig array
     * @param {String} newDisplayValue how the new value shall be shown to the user
     * @param {any} newValue the new value that will be saved in this.currentFilters[fiter.id].value
     */
    setFilterValue(filterId, newDisplayValue, newValue) {
      if (!this.filterConfigsById[filterId]) throw new Error("Don't know any filter with id="+filterId)
      if (!this.$refs[filterId]) throw new Error("Can't find ref to filter with id="+filterId)
      this.$refs[filterId][0].setFilterValue(newDisplayValue, newValue)
    },

    /** Clear the value of one filter */
    clearFilter(filterId) {
      this.$refs[filterId][0].clearFilter()
    },

    /** Reset all filters */
    clearAllFilters() {
      this.filtersConfig.forEach(filter => this.clearFilter(filter.id))
    },

  },

  created() {
    this.filtersConfig.forEach(filter => {
      this.filterConfigsById[filter.id] = filter
    })
  },

  /**
   Add one watcher for every filter. When the value of a filter changes then emit an "filterChanged" event.
   This is one event per filter. There is also the global tableFitlersChanged event.
   */
  mounted() {
    this.filtersConfig.forEach(filter => {
      this.$watch(
        function() {
          return this.currentFilters[filter.id]
        },
        function(newValue, oldValue) {
          this.$emit("filterChanged", filter, newValue, oldValue)
          if (typeof this.filterConfigsById[filter.id].onChange === "function") {
            // set scope of 'this' to DoogieTableFilters component
            this.filterConfigsById[filter.id].onChange.apply(this, [filter, newValue, oldValue])
          }
        }
      )
    })
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
</style>

