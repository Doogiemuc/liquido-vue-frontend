<template>
  <div class="btn-group" :id="id">
    <button type="button" class="btn btn-xs dropdown-toggle" :class="getActiveClass()" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
      {{name}}: {{displayValue}} <span class="caret"></span>
    </button>
    <div class="dropdown-menu">
      <ul class="selectList">
        <li v-for="option in options"><input type="checkbox" :value="option.value" v-model="selectedCheckboxes"/>&nbsp;{{option.displayValue || option.value}}</li>
      </ul>
      <div role="separator" class="selectDivider"></div>
      <button type="button" class="btn btn-primary btn-xs applyButton" v-on:click="applySelectedCheckboxes()">Apply</button>
      <button type="button" class="btn btn-default btn-xs clearButton" v-on:click="clearFilter()">Clear</button>
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
      value: [],                // Array of selected values (from options array)
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
     * @param {Object} filter One element from filtersConfig array
     * @param {String} newDisplayValue how the new value shall be shown to the user
     * @param {Array} newValue array of selected option.values
     */
    setFilterValue(newDisplayValue, newValue) {
      this.displayValue = newDisplayValue
      this.value = newValue
    },

    /**
     * Set the value of a multi select.
     * @param {Object} filter The filter object from your filtersConfig array
     * @param {array} values array with 'option.values' of all selected checkboxes
     */
    applySelectedCheckboxes() {
      var displayValue = ""
      // non selected: show "Any"
      // all selected: show "All"
      // one selected: show its display name
      // two selected: show their two display values  (if they have displayValues)
      // more selected: show e.g. "2/5"
      if (this.selectedCheckboxes.length == this.options.length) {
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
      this.setFilterValue(displayValue, this.selectedCheckboxes)
    },

    clearFilter() {
      this.selectedCheckboxes = []
      this.setFilterValue('Any', [])
    },

    /** When a filter is active, then style it accordingly */
    getActiveClass() {
      return this.value === undefined || this.value.length === 0  ? { 'btn-default' : true } : { 'btn-primary' : true }
    }
  },

}
</script>

<style scoped>
  .clearButton {
    float: left;
    margin-left: 5px;
  }
  .applyButton {
    float: right;
    margin-right: 5px;
  }
</style>

