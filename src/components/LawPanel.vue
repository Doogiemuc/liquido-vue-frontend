<template>
	<div class="panel panel-default">
    
    <div class="panel-heading">
      <i class="pull-right fa fa-university lawIcon grey" aria-hidden="true"></i>
      <h4 class="lawTitle">{{law.title}}</h4>
    </div>

    <div class="panel-body lawDescription">
      <!-- TODO: law.tagline -->
      {{law.description}}
      
      <timeline v-if="showTimeline" :timelineData="getTimelineDataFor(law)"></timeline>
    </div>
 
    <table class="table lawFooterTable">
      <tbody>
        <tr>
          <td><img src="/static/img/Avatar_32x32.jpeg" class="media-object userPicture"></td>
          <td class="userDataSmall">
            <i class="fa fa-fw fa-user" aria-hidden="true"></i>&nbsp;{{law.createdBy.profile.name}}<br/>
            <i class="fa fa-fw fa-bookmark" aria-hidden="true"></i>&nbsp;{{law.area.title}}
          </td>
          <td class="userDataSmall">
            <i class="fa fa-fw fa-clock-o" aria-hidden="true"></i>&nbsp;{{getFromNow(law.createdAt)}}<br/>
            <i class="fa fa-fw fa-balance-scale" aria-hidden="true"></i>&nbsp;{{law.numAltProposals}} alternatives<br/>
          </td>
          <td class="gotoPollCell">
            <router-link v-if="showGotoPoll" :to="{ path: '/poll', query: { proposal: this.getLawURI() }}" role="button" class="btn btn-default btn-xs">
              &nbsp;Goto poll &raquo;
            </router-link>
          </td>
        </tr>
      </tbody>
    </table>

<!--
    <div class="panel-footer">
      <div class="media">
        <div class="media-left"><img src="/static/img/Avatar_32x32.jpeg" class="media-object userPicture"></div>
        <div class="media-body">
          <div class="userDataSmall">
            <a href="#" role="button" class="btn btn-default btn-xs pull-right">&nbsp;Goto poll &raquo;</a>
            <i class="fa fa-user" aria-hidden="true"></i>&nbsp;{{law.createdBy.profile.name}}<br>
            <i class="fa fa-clock-o" aria-hidden="true"></i>&nbsp;{{getFromNow(law.createdAt)}}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<i class="fa fa-bookmark" aria-hidden="true"></i>&nbsp;{{law.area.title}}            
          </div>
        </div>
      </div>
    </div>
//-->

  </div>
</template>

<script>
import moment from 'moment'
import timeline from './Timeline'   // timeline component

export default {
	props: { 
    'law' : { type: Object, required: true },
    'showTimeline' : { type: Boolean, required: false, default: function() { return true } },
    'showGotoPoll' : { type: Boolean, required: false, default: function() { return true } },
  },

  components: {'timeline': timeline },

	methods: {
    getFromNow: function(dateVal) {
      return moment(dateVal).fromNow();
    },

    getTimelineDataFor(law) {
      var now = new Date().getTime()
      var created = new Date(law.createdAt).getTime()
      var timeForVoting = 30 * 24*3600*1000  // days in ms
      var percentFilled = ((now-created) / timeForVoting)*100
      //console.log((now-created)/1000+"sec since created", (now-created) / timeForVoting)
      return {
        percentFilled: percentFilled,
        events: [ 
          { percent:  "0",  above: "Proposal", below: "created"},
          { percent: "10",  above: "Quorum", below: "reached"},
          { percent: "20",  above: "Voting", below: "starts"},
          { percent: "100", above: "Voting", below: "ends"}
        ]
      }
    },

    getLawURI() {
      return this.$root.api.getURI(this.law)
    }
  }
}
</script>

<style scoped>
  .lawIcon {
  	font-size: 20px;
  }
  .lawTitle {
    margin-top: 0;
    margin-bottom: 0;
  }
  .lawDescription {
    /*background:  #fcfcfc;*/
  }
  .lawFooterTable {
    background: #f5f5f5;
  }
  .lawFooterTable td {
    padding: 3px 8px;
  }
  .gotoPollCell {
    text-align: right;
    vertical-align: middle;
  }
</style>
