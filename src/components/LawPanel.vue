<template>
	<div class="panel panel-default" :data-proposaluri="law._links.self.href">
    
    <div class="panel-heading">
			<i class="far fa-file-alt lawIcon pull-right" aria-hidden="true"></i>
			<router-link :to="getLawURL()">
				<h4 class="lawTitle">{{law.title}}</h4>
			</router-link>
    </div>

    <div class="panel-body lawDescription">
      <!-- TODO: law.tagline -->
      {{law.description}}
      
      <timeline v-if="showTimeline" :timelineData="getTimelineDataFor(law)"></timeline>
    </div>
		<div class="panel-footer">
 
			<table class="table lawFooterTable">
				<tbody>
					<tr>
						<td><img :src="law.createdBy.profile.picture" class="media-object userPicture"></td>
						<td class="userDataSmall">
							<i class="far fa-fw fa-user" aria-hidden="true"></i>&nbsp;{{law.createdBy.profile.name}}<br/>
							<i class="far fa-fw fa-bookmark" aria-hidden="true"></i>&nbsp;{{law.area.title}}
						</td>
						<td class="userDataSmall">
							<i class="far fa-fw fa-clock" aria-hidden="true"></i>&nbsp;{{getFromNow(law.createdAt)}}<br/>
						</td>
						<td class="likeButtonCell">
							<support-button :row="law"></support-button>
						</td>
					</tr>
				</tbody>
			</table>
		
		</div>
  </div>
</template>

<script>
/*
  A lawPanel shows one idea, proposal or law.
  It shows three rows: title, description with timeline and some attributes in the footer.
 */
import moment from 'moment'
import timeline from './Timeline'   // timeline component
import SupportButton from '../components/SupportButton'

export default {
  props: { 
    'law' : { type: Object, required: true },
    'showTimeline' : { type: Boolean, required: false, default: function() { return true } },
  },

  components: {
		'timeline': timeline,
		'support-button': SupportButton
	},

  methods: {
    getFromNow: function(dateVal) {
      return moment(dateVal).fromNow();
    },
    
    // dynamically set icon depending on law.status
    getIconFor: function(law) {
      return {
        "fa-lightbulb":   law.status == "IDEA",
        "fa-file-alt":    law.status == "PROPOSAL",
				"fa-file-alt":    law.status == "VOTING",
        "fa-university":  law.status == "LAW"
      }
    },
    
    likeToDiscuss(law) {
      //console.log("User "+this.$root.currentUser.email+", likes to discuss '"+idea.title+"'")
      this.$root.api.addSupporter(law, this.$root.currentUser).then(res => {
        //BUGFIX:  cannot simply update this.law, becasue Vue properties should not be updated. So we fire an event to parent instead:
        this.$emit("reloadLaw", law)  // notify parent to reload this law
      })
    },

    getTimelineDataFor(law) {
      var now = new Date().getTime()
      var createdMs = new Date(law.createdAt).getTime()
      var createdLoc = moment(law.createdAt).format('L')
      var elaborationStartsLoc = moment(law.elaborationStartsAt).format('L')
      var quorumReachedLoc     = moment(law.reachedQuorumAt).format('L')
      var votingStartsLoc      = moment(law.votingStartsAt).format('L')
      var votingEndsLoc        = moment(law.votingEndsAt).format('L')
      var timeForVoting = 30 * 24*3600*1000  // days in ms    //TODO: load timeForVoting from server (from profile)
      var percentFilled = ((now-createdMs) / timeForVoting)*100
      //console.log((now-created)/1000+"sec since created", (now-created) / timeForVoting)
      var timelineData = {}
      if (law.initialProposal) {
      	timelineData = {
	        percentFilled: percentFilled,
	        events: [ 
	          { percent:  "0",  above: elaborationStartsLoc, below: "Initial<br/>created" },
	          { percent: "30",  above: quorumReachedLoc, below: "Quorum<br/>reached"},
	          { percent: "45",  above: votingStartsLoc, below: "Voting<br/>starts"},
	          { percent: "100", above: votingEndsLoc, below: "Voting<br/>ends"}
	        ]
	      }
      } else {
      	timelineData = {
	        percentFilled: percentFilled,
	        events: [ 
	          { percent:  "0",  above: elaborationStartsLoc, below: "Elaboration<br/>starts" },
	          { percent: "15",  above: createdLoc, below: "Proposal<br/>created" },
	          { percent: "30",  above: quorumReachedLoc, below: "Quorum<br/>reached"},
	          { percent: "45",  above: votingStartsLoc, below: "Voting<br/>starts"},
	          { percent: "100", above: votingEndsLoc, below: "Voting<br/>ends"}
	        ]
	      }
      }
      return timelineData
    },

    getLawURL() {
      switch(this.law.status) {
        case 'IDEA':     return '/idea/'+this.law.id
        case 'PROPOSAL': return '/proposal/'+this.law.id
        case 'LAW':      return '/law/'+this.law.id
      }
    }
  }
}
</script>

<style scoped>
  .lawIcon {
  	font-size: 14pt;
  }
  .lawTitle {
    margin-top: 0;
    margin-bottom: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .lawDescription {
    /*background:  #fcfcfc;*/
  }
  .lawFooterTable {
    /* background: #f5f5f5; */
		margin: 0;
		padding: 0;
  }
  .lawFooterTable td {
    margin: 0;
		padding: 0;
		border: none;
  }
  .likeButtonCell {
    text-align: right;
		vertical-align: middle;
  }
</style>
