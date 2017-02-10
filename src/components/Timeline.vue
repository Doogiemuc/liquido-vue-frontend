<template>
  <div class="timeline">
    <div class="timeline_grey"></div>
    <ol style="list-style: none">
      <li v-for="event in this.timelineData.events" class="timeline_event circle" 
          v-bind:style="{left: event.percent+'%'}" 
          v-bind:class="{ selected: event.percent <= timelineData.percent }" >
      	<div class="event_above">{{event.above}}</div>
      	<div class="event_below">{{event.below}}</div>
      </li>
    </ol>
    <span class="filling_line" v-bind:style="{ width: timelineData.percent+'%' }"></span>
    <span class="glyphicon glyphicon-play timeline_arrow_right" aria-hidden="true"></span>  
  </div>
</template>

<script>
  export default {
  	props: {
  	  'timelineData' : { type: Object, required: true }
  	}
  }
</script>

<style type="text/css">
/* 
  Horizontal timeline 
  Inspired by https://codyhouse.co/demo/horizontal-timeline/index.html
*/

.timeline {
  position:relative; 
  height: 40px; 
  /*overflow: hidden;*/
  font-size: 11px;
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