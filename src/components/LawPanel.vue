<template>
	<div class="panel panel-default">
    <div class="panel-heading">
      <i class="pull-right fa fa-university lawIcon grey" aria-hidden="true"></i>
      <h3 class="lawTitle">{{law.title}}</h3>
    </div>
    <div class="panel-body">
      <!-- TODO: law.tagline -->
      {{law.description}}
      
      <timeline :timelineData="getTimelineDataFor(law)"></timeline>
    </div>
    <div class="panel-footer">
      <div class="media">
        <div class="media-left"><img src="/static/img/Avatar_32x32.jpeg" class="media-object userPicture"></div>
        <div class="media-body">
          <div class="news_heading">
            <a href="#" role="button" class="btn btn-default btn-xs pull-right">Show Details &raquo;</a>
            {{law.createdBy.profile.name}}<br>
            <span class="glyphicon glyphicon-time" aria-hidden="true"></span> {{getFromNow(law.createdAt)}}&nbsp;&nbsp;&nbsp;<span class="glyphicon glyphicon-tag" aria-hidden="true"></span> {{law.area.title}}            
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script>
import moment from 'moment'
import timeline from './Timeline'   // timeline component

export default {
	props: ['law'],

  components: {'timeline': timeline },

	methods: {
    getFromNow: function(dateVal) {
      return moment(dateVal).fromNow();
    },

    getTimelineDataFor(law) {
      var now = new Date().getTime()
      var created = new Date(law.createdAt).getTime()
      var timeForVoting = 1 * 24*3600*1000  // days in ms
      //console.log((now-created)/1000+"sec since created", (now-created) / timeForVoting)
      return {
        percent: ((now-created) / timeForVoting)*100,
        events: [ 
          { percent:  "0", above: "Created", below: ""},
          { percent: "10", above: "Quorum", below: "reached"},
          { percent: "20", above: "Voting", below: "starts"},
          { percent: "95", above: "Voting", below: "ends"}
        ]
      }
    }
  }
}
</script>

<style scoped>
  .news_heading {
    color: #999;
    font-size: 12px;
    line-height: 1.1;
  }
  .lawIcon {
  	font-size: 20px;
  }
  .lawTitle {
    margin-top: 0;
    margin-bottom: 0;
  }
</style>
