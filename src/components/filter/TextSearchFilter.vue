<template>
    <!-- Free text search field -->
    <input type="text" class="searchInput" :id="id" :name="name" :placeholder="placeholder" v-model="value"/>
</template>

<script>
/**
 Fiter componente for DoogieTable. Simply just one input field.
 */
export default {
  props: {
    id: { type: String, required: true },						// id of this filter
	name: { type: String, required: false, default: function() { return this.id } },			    // name of the input field
	placeholder: { type: String, required: false }
  },

  data () {
    return {
      value: undefined, // current value of the input field
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
     * Set the value of this text search input. (The value of an input IS its displayValue.)
     * @param {String} newValue the new value that will be saved in this.value
     */
    setFilterValue(newValue) {
      this.value = newValue
    },

    /**
     * Reset filter. Will also clear search field. All options will be shown.
     */
    clearFilter() {
      this.setFilterValue(undefined)
    },

  },


}
</script>

<style scoped>
 .searchInput {
    display: inline-block;
    height: 22px;
    padding-left: 5px;
    border: 1px solid #ccc;
    border-radius: 4px;
  }
</style>

