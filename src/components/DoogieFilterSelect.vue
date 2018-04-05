<template>
  <div class="btn-group">
    <!-- Select for one value out of a very long list. With an inner search input field. -->
    <button type="button" class="btn btn-default btn-xs dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
      {{config.displayName}}: {{displayValue}} <span class="caret"></span>
    </button>
    <div class="dropdown-menu">
      <input type="text" class="selectSearchInput" :id="config.id + 'Search'" placeholder="Search" v-model="searchText" v-on:keyup="selectSearchKeyup"/>
      <span class="glyphicon glyphicon-search form-control-feedback" aria-hidden="true"></span>
      <div role="separator" class="selectDivider"></div>
      <div class="selectListWrapper">
      <ul class="selectList">
        <li v-for="option in filteredOptions" v-on:click="setFilterValue(option.displayValue, option.value)">{{option.displayValue}}</li>
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
    // Configuration for this filter eg. { displayName: "Select2 Example", id: "selectID", options: [ { value:1, displayValue: "Eins" }, {...}, ... ]  }
    config: { type: Object, required: true },

    // this callback function will be triggered, when the filter has been changed. Then you need to apply the new filter settings to your data.
    filterChangedHandler: { type: Function, required: false },
  },

  data () {
    return {
      searchText: "",           // search input field
      displayValue: "Any",      // text displayed to the user for the currently selected option
      value: null,              // real value of currently selection option or null when nothing is selcted
      filteredOptions: [],      // list of options filtered by searchText
    }
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
      this.filteredOptions = this.config.options.slice()
      this.setFilterValue('Any', null)  
    },    
   
    /** 
     * Filter a list of options by their displayName or by their value. Compares case-insensitive.
     * @param {Array} options list of value objects, e.g. [ { value: 1, displayName: "Eins" }, { ... }, ... ]
     * @param {String} searchText the case insensitive text snippet to search for in value.displayName or value.value
     * @returns the filtered list of values. An array of value objects.
     */
    getFilteredOptions(options, searchText) {
      searchText = searchText || ""
      return options.filter(option => {
        var val = option.displayValue || option.value || ""
        return val.toLowerCase().indexOf(searchText.toLowerCase()) > -1
      })
    },

    /**
     * Calles everythime a key was pressed in the search input field of a select filter.
     * Will filter the selectValues by the current search text. By default matches strings case insensitive.
     * @param {Object} filter One element from filtersConfig array
     */
    selectSearchKeyup() {
      var filterFunc = this.config.filterFunc || this.getFilteredOptions
      this.filteredOptions = filterFunc(config.options, this.searchText)
      console.log("keyup:", this.filteredOptions.length, "match")
    },

  },

  created () {
    this.config.options  = this.config.options || []
    this.filteredOptions = this.config.options.slice()      // copy array
    console.log(this.config, this.filteredOptions)
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

