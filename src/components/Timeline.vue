  /*

  Horizontal timeline
  Inspired by https://codyhouse.co/demo/horizontal-timeline/index.html

  This is how you initialize the events along the timeline

      exampleTimelineData = {
        height: 40,             // height in pixels
        fillTo: new Date(),     // how far the timeline shall be filled
        events: [
          { date: new Date(...), above: "Proposal", below: "start"},
          { date: new Date(...), above: "Quorum", below: "in between"},
          { date: new Date(...), above: "Voting", below: "starts"},
          { date: new Date(...), above: "Voting", below: "end"}
        ]
      }

  You can also pass percent values instead of dates.

   */

<template>
  <div class="timeline" :style="{ height: height+'px' }" >
    <div class="timeline_grey"></div>
    <span class="filling_line" v-bind:style="{ width: this.percentFilled+'%' }"></span>
    <span :class="arrowClass"></span>
    <ol style="list-style: none">
      <li v-for="event in this.events"
          class="timeline_event circle"
          v-bind:style="{ left: getPercent(event)+'%'}"
          v-bind:class="{ filledCircle: isFilled(event) }" >
        <div class="event_above" v-html="event.above || '&nbsp;'"></div>
        <div class="event_below" v-html="event.below || '&nbsp;'"></div>
      </li>
    </ol>
  </div>

</template>


<script>
  export default {
  	props: {
      height: { type: Number, required: false, default: function() { return 40 } },
      fillTo: { type: Date,   required: false, default: function() { return new Date() } },
  	  events: { type: Array,  required: true, validator:
        function(events) {
          if (events == null) { return false }
          events.forEach(event => {
            if (event.date === undefined && event.percent === undefined) { return false }
            if (event.date && typeof event.date.getMonth !== 'function') { return false }
          })
          return true
        }
      }
  	},

    computed: {
      startDate() { return this.events[0].date },
      endDate() { return this.events[this.events.length-1].date },
      percentFilled() { return this.date2percent(this.fillTo, this.startDate, this.endDate) },
      arrowClass() {
        return {
          timeline_arrow_right: true,
          timeline_arrow_right_fillled: this.endDate - this.fillTo <= 0    // timeline is fully filled
        }
      },
    },

    //TODO:  maybe it would be easier to watch: { events : function(newEvents, oldEvents) { ... } }

    methods: {
      /** limit val between min and max, so that min <= returned val <= max */
      limit(val, min, max) {
        if (val < min) return min
        if (val > max) return max
        return val
      },

      isFilled(event) {
        return this.getPercent(event) <= this.percentFilled
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

      getPercent(event) {
        if (event.percent !== undefined) {
          return event.percent
        } else {
          return this.date2percent(event.date, this.startDate, this.endDate)
        }
      }
    },

    created () {
      this.events.forEach(event => {
        if (event.date !== undefined) {
          event.percent = this.date2percent(event.date, this.startDate, this.endDate)
        } else {
          event.percent = this.limit(event.percent, 0, 100)
        }
      })
    }
  }
</script>

<style scoped>

.timeline {
  position:relative;
  /*overflow: hidden;*/
  font-size: 12px;
  width: 95%;
  margin: 0 auto;
}

.timeline .timeline_grey {
  position: absolute;
  z-index: 0;
  left:0;
  top: 2em;
  width: 99%;
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
  top: 1.4em;
  right: 0px;
  width: 0px;
  height: 0px;
  border-style: solid;
  border-width: 8px 0 8px 15px;
  border-color: transparent transparent transparent #DDD;
}

.timeline_arrow_right_fillled {
  border-color: transparent transparent transparent #66A;
}

</style>