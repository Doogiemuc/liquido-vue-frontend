<template>
  <div :id="id" class="btn-group">
    <!-- Select for one value out of a very long list. With an inner search input field. -->
    <button type="button" class="btn btn-xs dropdown-toggle" :class="getActiveClass()" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
      {{name}}: {{displayValue}} <span class="caret"></span>
    </button>
    <div class="dropdown-menu">
      <input type="text" class="selectSearchInput" :id="id + 'Search'" placeholder="Search" v-model="searchText"/>
      <span class="glyphicon glyphicon-search form-control-feedback" aria-hidden="true"></span>
      <div role="separator" class="selectDivider"></div>
      <div class="selectListWrapper">
      <ul class="selectList">
        <li v-for="option in getFilteredOptions" v-on:click="setFilterValue(option.displayValue, option.value)">{{option.displayValue}}</li>
      </ul>
      </div>
      <div role="separator" class="selectDivider"></div>
      <button type="button" class="btn btn-default btn-xs clearButton" v-on:click="clearFilter">Clear</button>
    </div>
  </div>
</template>

<script>
/**
 Fiter componente for DoogieTable. This is a select box with a drop down and a quick search field for options in the drop down.
 This is especially userfull, when there a lot of possible options in the select.
 Each option has a name and an internal value.
 */
export default {
  props: {
    id: { type: String, required: true },						// id of this filter
		name: { type: String, required: true },			    // filter name to display to the user. Will be concatenated with displayValue
		options: { type: Array, required: true },				// (possibly long) list of options [{ value: 5, displayValue: "Fünf" }, {...}, ... ]
  },

  data () {
    return {
      searchText: "",           // search input field
      displayValue: "Any",      // text displayed to the user for the currently selected option  (==option[i].displayValue)
      value: undefined,         // intenal value of currently selection option
                                // This is undefined when nothing is selcted or the the options[i].value from the options array.
    }
  },

	watch: {
		value: function(newValue, oldValue) {   // "value" is the name of the Vue prop
      //console.log("DoogieFilterSelect.value changed to ", newValue)
			this.$emit('input', newValue /*{displayValue: this.displayValue, value: this.value}*/)				//  https://vuejs.org/v2/guide/components.html#Using-v-model-on-Components
		},
	},

  computed: {
    /**
     * Filter a list of options by their name or by their value. Compares case-insensitive.
     * The result of this computed propery is cached. Will be updated, everytime when this.searchText changes
     * @returns filtered sublist of this.options
     */
    getFilteredOptions() {
      var searchRegex = new RegExp(this.searchText || "", "i")
      return this.options.filter(opt => searchRegex.test(opt.displayValue))
    },

  },

  methods: {
    /**
     * set the value of this filter
     * @param {Object} filter One element from filtersConfig array
     * @param {String} newDisplayValue how the new value shall be shown to the user
     * @param {any} newValue the new value that will be saved in this.value
     */
    setFilterValue(newDisplayValue, newValue) {
      this.displayValue = newDisplayValue
      this.value = newValue
    },

    /**
     * Reset filter. Will also clear search field. All options will be shown.
     */
    clearFilter() {
      this.searchText = ""
      this.setFilterValue('Any', undefined)
    },

    /** When a filter is active, then style it accordingly */
    getActiveClass() {
      var filterCleared = this.value === undefined
      return {
        'btn-default': filterCleared,
        'btn-primary': !filterCleared
      }
    }
  },

}
</script>

<style scoped>

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

