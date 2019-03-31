<template>
    <!-- Switch On/Off filter button-->
    <button type="button" :id="id" class="btn btn-xs" :class="activeClass" @click="toggle()">{{name}}</button>
</template>

<script>
/**
 Fiter componente for DoogieTable. One button that can be turned on and off
 */
export default {
  props: {
    id: { type: String, required: true },						// id of this filter
		name: { type: String, required: false, default: function() { return this.id } },			    // name of the input field
  },

  data () {
    return {
      value: false
    }
  },

	watch: {
    // See  https://vuejs.org/v2/guide/components.html#Using-v-model-on-Components
		value: function(newValue, oldValue) {
			this.$emit('input', newValue)
		},
	},

  computed: {
    activeClass: function() {
      return this.value ? { 'btn-primary' : true } : { 'btn-default' : true }
    },
  },

  methods: {
    /**
     * set the value of this filter
     * @param {String} newValue the new value that will be saved in this.value
     */
    setFilterValue(newValue) {
      this.value = newValue
    },

    /**
     * Reset filter. Will also clear search field. All options will be shown.
     */
    clearFilter() {
      this.setFilterValue(false)
    },

    toggle() {
      this.value = !this.value
    },

  },


}
</script>

<style scoped>

</style>

