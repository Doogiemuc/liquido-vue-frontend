  /*
  
  Horizontal timeline 
  Inspired by https://codyhouse.co/demo/horizontal-timeline/index.html


      exampleTimelineData = {
        height: 40,  // pixels
        percentFilled: 80,
        events: [ 
          { percent:  "0", above: "Proposal", below: "created"},  //TODO: make it possible to pass dates instead of percentage values
          { percent: "10", above: "Quorum", below: "reached"},
          { percent: "20", above: "Voting", below: "starts"},
          { percent: "95", above: "Voting", below: "ends"}
        ]
      }

   */

<template>
  <div class="timeline" :style="{ height: height+'px' }" >
    <div class="timeline_grey"></div>
    <ol style="list-style: none">
      <li v-for="event in this.events" 
          class="timeline_event circle" 
          v-bind:style="{ left: event.percent+'%'}" 
          v-bind:class="{ selected: event.percent <= percentFilled }" >
        <div class="event_above" v-html="event.above"></div>
        <div class="event_below" v-html="event.below"></div>
      </li>
    </ol>
    <span class="filling_line" v-bind:style="{ width: percentFilled+'%' }"></span>
    <span class="glyphicon glyphicon-play timeline_arrow_right"></span>  
  </div>

</template>


<script>
  export default {
  	props: {
      height: { type: Number, required: false, default: function() { return 40 } },
      percentFilled: { type: Number, required: true },
  	  events: { type: Array, required: true }    //TODO: make it possible to pass dates instead of percentage values
  	},

    methods: {
      limit(val, min, max) {
        if (val < min) return min
        if (val > max) return max
        return val
      },

      date2percent(date, start, end) {
        var period = end.getTime() - start.getTime()     // number of millisecdons between start and end
        var rel    = date.getTime() - start.getTime()    // number of milliseconds from start until date (might be negative if date is bevor start)
        var percent = rel / period * 100
        return this.limit(percent, 0, 100)
      }
    },

    mounted () {
      this.percentFilled = this.limit(this.percentFilled, 0, 100)
      this.events.forEach(event => {
        event.percent = this.limit(event.percent, 0, 100)
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
  top: 18px; 
  width: 99%; 
  height:2px; 
  background: #dfdfdf;
}

.timeline .filling_line {
  z-index: 10;
  position: absolute;
  left: 0;
  top: 18px;
  height: 2px;
  background-color: #66A;
}

.timeline .timeline_event {
  position: absolute;
  top: 0;
  /* left: 40% can be set in style="..." to position the evnet */
  text-align: center;
  color: #999;
  transform: translateX(-50%);
}

.timeline .timeline_event .event_above {
  /* nothing to set here */
  color: #999;
}

.timeline .timeline_event .event_below {
  color: #999;
  margin-top: 8px;
  white-space: nowrap;
}

/* circle for timeline events */
.timeline .circle:after {
  z-index: 3;
  content: '';
  position: absolute;
  top: 14px;
  left: 50%;
  right: auto;
  width: 10px;
  height: 10px;
  background-color: #FFF;
  border: 2px solid #ddd;
  border-radius: 50%;
  transform: translateX(-50%);
}

.timeline .selected:after {
  z-index: 3;
  border: 2px solid #66A;
  background-color: #66A; 
}

.timeline_arrow_right {
  z-index: 3;
  position: absolute;
  color: #ddd;
  right: 0;
  top: 13px;
}
</style>