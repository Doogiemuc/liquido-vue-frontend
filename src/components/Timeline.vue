  /*

  Horizontal timeline
  Inspired by https://codyhouse.co/demo/horizontal-timeline/index.html

  This is how you initialize the events along the timeline

	  exampleTimelineData = {
		height: 40,          // full height of component in pixels.  The absolut positioned texts require to have a fixed height. It is VERY hard to make a DIV as high as some inner absolutely posinnioned child DIVs. Give it a try!
		fillToPercent: 65,   // percentage, how far the timeline shall be filled. You can use this.date2percent(date, start, end) to fill up to a given date
		fillToDate: new Date()  // when you add dates to the events, then this timeline component can interpolate this given date value between the percentage positions of the events.
		events: [
		  { percent:   0, date: new Date(isoDateStr), above: "Proposal", below: "start"},
		  { percent:  10, above: "Quorum",   below: "in between"},
		  { percent:  30, above: "Voting",   below: "starts"},
		  { percent: 100, date: new Date(isoDateStr), above: moment().format('L') },   
		]
	  }
	  
  TODO: Make it possible to pass "dates" in addition to percentages. And then over to fill until "today". Needs to be interpolated between the event dates on percentage positions.

   */

<template>
	<div class="timeline" :style="{ height: height+'px' }" >
		<div class="timeline_grey"></div>
		<span class="filling_line" v-bind:style="{ width: this.fillingLineWidth+'%' }"></span>
		<span :class="arrowClass"></span>
		<div class="eventsWrapper">
			<ol class="eventsList">
			  <li v-for="event in this.events"
			      :key="event.above"
				  class="timeline_event circle"
				  v-bind:style="{ left: event.percent+'%'}"
				  v-bind:class="{ filledCircle: isFilled(event) }" >
				<div class="event_above" v-html="event.above || '&nbsp;'"></div>
				<div class="event_below" v-html="event.below || '&nbsp;'"></div>
			  </li>
			</ol>
		</div>
	</div>
</template>


<script>
  export default {
	props: {
	  height:     { type: Number, required: false, default: function() { return 40 } },
	  // by default a timeline is filled until today's date
	  fillToPercent: { type: Number, required: false, default: function() { return 0 } },

	  // If you pass a date here, then the timeline will be filled up to that date (in between the events positioned by percentages)
	  fillToDate:    { type: Date,   required: false },

	  // list of events in the timeline. Each event MUST have a date or a percentage value
	  events: { type: Array,  required: true, validator:
		function(events) {
		  if (!events || events.length < 1) { return false }
		  events.forEach(event => {
			if (event.percent === undefined) { return false }
			if (event.date && typeof event.date.getMonth !== 'function') { return false }
		  })
		  return true
		}
	  }
	},

	data: function() { 
		return {
			fillingLineWidth: this.fillToPercent
		}
	},

	computed: {
	  arrowClass() {
		return {
		  timeline_arrow_right: true,
		  timeline_arrow_right_fillled: this.fillingLineWidth >= 100     // timeline arrow is filled when timeline is is fully filled
		}
	  },
	  firstDate() { return this.events[0].date },
	  lastDate()  { return this.events[this.events.length-1].date }
	},

	//TODO:  maybe it would be easier to watch: { events : function(newEvents, oldEvents) { ... } }

	methods: {
	  /** limit val between min and max, so that min <= returned val <= max */
	  limit(val, min, max) {
		if (val < min) return min
		if (val > max) return max
		return val
	  },

	  /** event circles are filled when they are in the past */
	  isFilled(event) {
		return event.percent <= this.fillingLineWidth
	  },

	  /**
	   * Utility method to convert a date to a percentage value between start and end date
	   * This can be accessed as 'timeline.methods.date2percent' from parent components
	   * Needs three Date() objects. Will return 0 otherwise.
	   */
	  date2percent(date, start, end) {
		if (date == null || start == null || end == null) return 0
		var period = end.getTime() - start.getTime()     // number of millisecdons between start and end
		var rel    = date.getTime() - start.getTime()    // number of milliseconds from start until date (might be negative if date is bevor start)
		if (period == 0) return 0;
		var percent = rel / period * 100
		return this.limit(percent, 0, 100)
	  },

		fillUpTo(date) {
			if (!this.firstDate || !this.lastDate) throw new Error("Events must have dates to fillUpTo(date)")
			if (date.getTime() < this.firstDate.getTime()) {
				this.fillingLineWidth = 0
			} else 
			if (date.getTime() > this.lastDate.getTime()) {
				this.fillingLineWidth = 100
			} else {
				var nextEventIdx = this.events.findIndex(event => event.date.getTime() > date.getTime())
				var before = this.events[nextEventIdx-1]
				var after  = this.events[nextEventIdx  ]
				var innerPercent = this.date2percent(date, before.date, after.date)
				this.fillingLineWidth = before.percent + (after.percent - before.percent)*innerPercent/100
			}
	  	},
 
	},

	/**
	 * When no dates are given for events that calculate percentage values from the given dates. 
	 */
	created () {
		this.events.forEach(event => {
			if (event.percent === undefined) {
				if (event.date === undefined) throw new Error("You MUST either set percent or dates for timeline events.")
				var startDate = this.events[0].date
				var endDate   = this.events[this.events.length-1].date
				event.percent = this.date2percent(event.date, startDate, endDate)
			}
			event.percent = this.limit(event.percent, 0, 100)
		})
		console.log("Filling up to ", this.fillToDate)
		if (this.fillToDate && typeof this.fillToDate.getMonth === 'function') {
			console.log("Filling up to ", this.fillToDate)
			this.fillUpTo(this.fillToDate)
		}
	}
  }
</script>

<style scoped>

.timeline {
  position: relative;
  overflow: hidden;
}

.timeline .timeline_grey {
  position: absolute;
  z-index: 0;
  left:0;
  top: 2em;
  width: 100%;
  height: 2px;
  background: #dfdfdf;
}

.timeline .filling_line {
  z-index: 2;
  position: absolute;
  left: 0;
  top: 2em;
  height: 2px;
  background-color: #66A;
}

.timeline .eventsWrapper {
	position: relative;
}

.timeline .eventsList {
	list-style: none;
	margin: 0;
	padding: 0;
}

.timeline .timeline_event {
  position: absolute;
  top: 0;
  /* left: 40% will be set in style="..." to position the evnet */
  text-align: center;
  color: #999;
  transform: translateX(-50%);
}

.timeline .timeline_event .event_above {
  color: #999;
}

.timeline .timeline_event .event_below {
  color: #999;
  margin-top: 15px;
  white-space: nowrap;
}

/* circle for timeline events */
.timeline .circle:after {
  z-index: 3;
  content: '';
  position: absolute;
  top: 2em;
  left: 50%;
  right: auto;
  width: 10px;
  height: 10px;
  background-color: #FFF;
  border: 2px solid #DDD;
  border-radius: 50%;
  transform: translate(-50%, -50%);
}

.timeline .filledCircle:after {
  z-index: 3;
  border: 2px solid #66A;
  background-color: #66A;
}

.timeline_arrow_right {
  z-index: 3;
  position: absolute;
  content: "";
  top: 2em;
  right: 0px;
  transform: translateY(-50%);
  border-style: solid;
  border-width: 8px 0 8px 15px;
  border-color: transparent transparent transparent #DDD;
}

.timeline_arrow_right_fillled {
  border-color: transparent transparent transparent #66A;
}

</style>