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
    <span class="filling_line" v-bind:style="{ width: percentFilled+'%' }"></span>
    <span class="timeline_arrow_right"></span>  
    <ol style="list-style: none">
      <li v-for="event in this.events" 
          class="timeline_event circle" 
          v-bind:style="{ left: event.percent+'%'}" 
          v-bind:class="{ selected: event.percent <= percentFilled }" >
        <div class="event_above" v-html="event.above || '&nbsp;'"></div>
        <div class="event_below" v-html="event.below"></div>
      </li>
    </ol>
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
  border: 2px solid #ddd;
  border-radius: 50%;
  transform: translate(-50%, -50%);
}

.timeline .selected:after {
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
  border-color: transparent transparent transparent #ddd;

}
</style>