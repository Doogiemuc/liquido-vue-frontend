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
        <li v-for="option in getFilteredOptions" :key="option.value" v-on:click="setFilterValue(option.value, option.displayValue)">{{option.displayValue}}</li>
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
                                                    // Option.values may also be objects. This component will hold on of these values as its v-model
  },

  data () {
    return {
      searchText: "",           // search input field
      displayValue: "Any",      // text displayed to the user for the currently selected option  (==options[i].displayValue)
      value: undefined,         // internal value of the currently selection option              (==options[i].value)
                                // This is undefined when nothing is selcted.
    }
  },

	watch: {
    // See  https://vuejs.org/v2/guide/components.html#Using-v-model-on-Components
		value: function(newValue, oldValue) {
			this.$emit('input', newValue)
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
	 * @param {any} newValue the new value that will be saved in this.value
	 * @param {String} newDisplayValue how the new value shall be shown to the user
     */
    setFilterValue(newValue, newDisplayValue) {
      this.searchText = ""
      this.displayValue = newDisplayValue
      this.value = newValue
    },

    /**
     * Reset filter. Will also clear search field. All options will be shown.
     */
    clearFilter() {
      this.searchText = ""
      this.setFilterValue(undefined, 'Any')
    },

    /** When a filter is active, then style it accordingly */
    getActiveClass() {
      return this.value === undefined ? { 'btn-default' : true } : { 'btn-primary' : true }
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

