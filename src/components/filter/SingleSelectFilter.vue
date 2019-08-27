<template>
  <div :id="id" class="btn-group">
    <button type="button" class="btn btn-xs dropdown-toggle" :class="getActiveClass()" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
      {{name}}: {{displayValue}} <span class="caret"></span>
    </button>
    <ul class="dropdown-menu">
      <li v-for="option in options" :key="option.value"><a class="selectItem" v-on:click="setFilterValue(option.value, option.displayValue)">{{option.displayValue}}</a></li>
      <li role="separator" class="selectDivider"></li>
      <li><button type="button" class="btn btn-default btn-xs clearButton" v-on:click="clearFilter()">Clear</button></li>
    </ul>
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

  methods: {
    /**
     * set the value of this filter. DisplayValue will betaken from options array
     * @param {any} newValue the new value that will be saved in this.value
	 * @param {String} displayValue the value to show to the user. If undefined, will be taken from this.options[idx].displayValue
     */
    setFilterValue(newValue, displayValue) {
	  this.value = newValue
	  if (displayValue === undefined) {
		var opt = this.options.find(opt => opt.value === newValue) 
		console.log("Setting undefined displayValue to ", opt)
		if (opt !== undefined) {
			this.displayValue = opt.displayValue
		}
	  } else {
		console.log("Setting displayValue to ",displayValue)
		this.displayValue = displayValue
	  }
    },

    setSelectedOption(idx) {
      console.log("setSelectedOption", this.options)
      this.setFilterValue(this.options[idx].value)
    },

    /**
     * Reset filter. Will also clear search field. All options will be shown.
     */
    clearFilter() {
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
  .clearButton {
    float: right;
    margin-right: 5px;
  }
</style>

