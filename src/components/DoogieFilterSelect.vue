<template>
  <div :id="id" class="btn-group" >
    <!-- Select for one value out of a very long list. With an inner search input field. -->
    <button type="button" class="btn btn-default btn-xs dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
      {{displayName}}: {{displayValue}} <span class="caret"></span>
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
      <button type="button" class="btn btn-default btn-xs clearButton" v-on:click="clearSearch">Clear</button>
    </div>
  </div>
</template>

<script>

export default {
  props: {
    id: { type: String, required: true },								// id of this filter
		displayName: { type: String, required: true },			// name to display to the user 
		options: { type: Array, required: true },						// (long) list of possible options [{ value: 5, displayValue: "Fünf" }, ... ]
  },

  data () {
    return {
      searchText: "",           // search input field
      displayValue: "Any",      // text displayed to the user for the currently selected option
      value: null,              // real value of currently selection option or null when nothing is selcted
      //filteredOptions: this.options,      // list of options filtered by searchText
    }
  },

	watch: {
		value: function(newValue, oldValue) {
			this.$emit('input', {displayValue: this.displayValue, value: this.value})				//  https://vuejs.org/v2/guide/components.html#Using-v-model-on-Components
		},
    options: function(newValue, oldValue) {
      this.filteredOptions = this.options
    },
	},

  computed: {
    /** 
     * Filter a list of options by their displayName or by their value. Compares case-insensitive.
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
     * @param {any} newValue the new value that will be saved in this.currentFilters[fiter.id].value
     */
    setFilterValue(newDisplayValue, newValue) {
      this.displayValue = newDisplayValue
      this.value = newValue
    },

    /**
     * Reset search input field. All selectValues will be shown
     * @param {Object} filter One element from filtersConfig array
     */
    clearSearch() {
      this.searchText = ""
      this.filteredOptions = this.options
      this.setFilterValue('Any', null)  
    },    
   

  },

  created () {
    //this.filteredOptions = this.options     
  }
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

