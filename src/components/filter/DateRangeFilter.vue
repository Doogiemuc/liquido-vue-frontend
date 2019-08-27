<template>
  <div :id="id" class="dropdown">
    <!-- Table Filter for a data range -->
    <button type="button" class="btn btn-xs dropdown-toggle" :class="getActiveClass()" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
      {{name}}: {{displayValue}} <span class="caret"></span>
    </button>
    <ul class="dropdown-menu">
      <li><a v-on:click="setDateRangeToPastDays(0)">Today</a></li>
      <li><a v-on:click="setDateRangeToPastDays(7)">Last 7 days</a></li>
      <li><a v-on:click="setDateRangeToPastDays(14)">Last 14 days</a></li>
      <li role="separator" class="selectDivider"></li>
      <li><button type="button" class="btn btn-default btn-xs clearButton" v-on:click="clearFilter()">Clear</button></li>
    </ul>
  </div>
</template>

<script>
/**
 Fiter componente for DoogieTable that filters for a data range.
 */
export default {
  props: {
    id: { type: String, required: true },						// id of this filter
		name: { type: String, required: true },			    // name of this date field that is displayed to the user
  },

  data () {
    return {
      value: undefined,                             // will become     { start: Date(), end: Date() }
      displayValue: "Anytime",
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
     * @param {String} newDisplayValue textual representation of current start-end period of time, e.g.  "last two weeks"
     * @param {Object} newValue internal value, e.g. { start: startDate, end: endDate }
     */
    setFilterValue(newValue, newDisplayValue) {
      this.displayValue = newDisplayValue
      this.value = newValue
    },

    /**
     * Reset filter. Will also clear search field. All options will be shown.
     */
    clearFilter() {
      this.setFilterValue(undefined, "Anytime")
    },

 // "Points in time in the universe and our names for them. I'll never understand why we humans have such great problems with the concept of time." (R.Rackl 2018)
    /**
     * Set a date range between nDays in the past and (end of) today.
     * newValue will be set to { from: <date nDays in the past>, until: <end of today> }
     * @param {integer} nDays number of days to go into the past
     */
    setDateRangeToPastDays(nDays) {
      var newDisplayValue = nDays == 0 ? "Today" : "Last "+nDays+" days"
      var newValue = {}
      var start = new Date()
      start.setHours(0,0,0,0)         // start of the first day at midnight
      newValue.start = new Date(start.getTime() - nDays*24*3600*1000)    // n days in the past
      var end = new Date()
      end.setHours(23,59,59,999)
      newValue.end = end
      this.setFilterValue(newValue, newDisplayValue)
    },

    //TODO: datePicker for date ranges.

    /**
     * @param {object|string|number} date Can be passed as JS Date object, ISO date string or number of milliseconds
     * @param {object} dateRange {start: <date>, end: <date> }    Keep in mind that JS dates are actually datetime.
     * @return true, when date is within dateRange.start and dateRange.end
     */
    isInDateRange(date, dateRange) {
      date = new Date(date)  // allow everything new Date is able to parse,  e.g. ISO strings
      //console.log("isInDateRange", date, dateRange, dateRange.start <= date && date <= dateRange.end)
      return dateRange.start <= date && date <= dateRange.end
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

