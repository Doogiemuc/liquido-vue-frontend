<template>
  <div class="btn-group" :id="id">
    <button type="button" class="btn btn-xs dropdown-toggle" :class="getActiveClass()" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
      {{name}}: {{displayValue}} <span class="caret"></span>
    </button>
    <div class="dropdown-menu" @click="clickDropdown">
      <ul class="selectList">
        <li v-for="option in options" :key="option.value" @click="toggleOption"><input type="checkbox" :value="option.value" v-model="selectedCheckboxes"/>&nbsp;{{option.displayValue || option.value}}</li>
      </ul>
      <div role="separator" class="selectDivider"></div>
      <button type="button" class="btn btn-primary btn-xs applyButton" @click="applyCheckboxes">Apply</button>
      <button type="button" class="btn btn-default btn-xs clearButton" @click="clearFilter">Clear</button>
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
      displayValue: "Any",      // text displayed to the user for the currently selected option  (==options[i].displayValue)
      value: undefined,         // Array of selected values (from options array)
      selectedCheckboxes: [],   // v-model for HTML checkboxes
    }
  },

	watch: {
    // See  https://vuejs.org/v2/guide/components.html#Using-v-model-on-Components
		value: function(newValue, oldValue) {
			this.$emit('input', newValue)
		},
	},

  methods: {
    /**
     * set the value of this filter
	 * @param {Array} newValue array of selected option.values
	 * @param {Object} filter One element from filtersConfig array
     * @param {String} newDisplayValue how the new value shall be shown to the user
     */
    setFilterValue(newValue, newDisplayValue) {
      this.value = newValue
      this.selectedCheckboxes = newValue || []
      this.displayValue = newDisplayValue || this.calcDisplayValue()
    },

    /* select or deselect an option when clicking anywhere in that row. */
    toggleOption(evt) {
      $(evt.target).children("input:checkbox").click()
    },

    /**
     * Create a meaningful display value from the currently selected checkboxes
     */
    calcDisplayValue() {
      var displayValue = ""
      // non selected: show "Any"
      // all selected: show "All"
      // one selected: show its display name
      // two selected: show their two display values  (if they have displayValues)
      // more selected: show e.g. "3/9"
      if (this.selectedCheckboxes === undefined || this.selectedCheckboxes.length === 0) {
        displayValue = 'Any'
      } else if (this.selectedCheckboxes.length == this.options.length) {
        displayValue = 'All'
      } else if (this.selectedCheckboxes.length == 1) {
        var selectedOption = this.options.find((option) => option.value == this.selectedCheckboxes[0])
        displayValue = selectedOption ? selectedOption.displayValue : "1/"+this.options.length
      } else if (this.selectedCheckboxes.length == 2) {
        var selectedOption1 = this.options.find((option) => option.value == this.selectedCheckboxes[0])
        var selectedOption2 = this.options.find((option) => option.value == this.selectedCheckboxes[1])
        displayValue = selectedOption1 && selectedOption2 ? (selectedOption1.displayValue+","+selectedOption2.displayValue) : "2/"+this.options.length
      } else {
        displayValue = this.selectedCheckboxes.length  +'/'+this.options.length
      }
      return displayValue
    },

    /** Apply users selection to our internval value. */
    applyCheckboxes() {
      $('#'+this.id+' .dropdown-toggle').dropdown("toggle");
      var newDisplayValue = this.calcDisplayValue()
      var newValue = this.selectedCheckboxes.length === 0 ? undefined : this.selectedCheckboxes
      this.setFilterValue(newValue, newDisplayValue)
    },

    /** deselect all options */
    clearFilter() {
      $('#'+this.id+' .dropdown-toggle').dropdown("toggle");
      this.selectedCheckboxes = []
      this.setFilterValue(undefined, 'Any')
    },

    /** When a filter is active, then style it accordingly */
    getActiveClass() {
      return !this.value || this.value.length === 0  ? { 'btn-default' : true } : { 'btn-primary' : true }
    },

    /** prevent automatic closing of bootstrap dropdown */
    clickDropdown(evt) {
      evt.stopPropagation();
    }
  },

}
</script>

<style scoped>
  .selectList {
    list-style: none;
    padding-inline-start: 5px;
    cursor: pointer;
  }
  .selectList li:hover {
    background: #f8f8f8;
  }
  .clearButton {
    margin-left: 5px !important;
  }
  .applyButton {
    float: right;
    margin-right: 5px;
  }
</style>

