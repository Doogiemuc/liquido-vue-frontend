<template>
	<div class="panel panel-default" :data-proposaluri="law._links.self.href">
    <div class="panel-heading">
			<router-link :to="getLinkToLaw()">
        <i class="far lawIcon pull-right" :class="getIconForLaw" aria-hidden="true"></i>
				<h4 class="lawTitle">{{law.title}}</h4>
			</router-link>
    </div>
    <div class="panel-body lawDescription" :style="getLawDescriptionStyle()">
      {{law.description}}
      <timeline v-if="showTimeline" :height="60" :percentFilled="timelinePercentFilled" :events="timelineEvents"></timeline>
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
              <i v-if="law.poll !== null" class="fas fa-balance-scale"></i>&nbsp;<router-link v-if="law.poll !== null" :to="'/showPoll/'+law.poll.id">Poll</router-link>
						</td>
						<td class="likeButtonCell">
							<support-button :row="law" v-on:like="likeToDiscuss"></support-button>
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
import timeline from './Timeline' 
import SupportButton from '../components/SupportButton'

export default {
  props: { 
    'law' : { type: Object, required: true },
    'showTimeline' : { type: Boolean, required: false, default: function() { return true } },
    'fixedHeight' : { type: Number, required: false, default: function() { return undefined } },
  },

  components: {
		'timeline': timeline,
		'support-button': SupportButton
	},

  computed: {
    // dynamically set icon depending on law.status  
    // BUGFIX: Must be a computed prop. Not a method!
    getIconForLaw: function(law) {
      switch(law.status) {
        case "IDEA": return { "fa-lightbulb": true }
        case "LAW":  return { "fa-university": true }
        default:     return { "fa-file-alt": true }
      }
    },

    timelinePercentFilled() {
      var start = new Date(this.law.createdAt)
      var today = new Date()
      var end
      switch (this.law.status) {
        case "IDEA": 
          return 10
        case "PROPOSAL":
          end = new Date(this.law.reachedQuorumAt)
          break;
        case "ELABORATION":
          end = new Date(this.law.poll.votingEndAt)
          break;
        //case "LAW"
        //case "RETENTION"
        default:
          end = today
      }
      return timeline.methods.date2percent(today, start, end)
    },

    timelineEvents() {
      if (this.law.status === "IDEA") return [ 
        { percent: "5", above: moment(this.law.createdAt).format('L'), below: "created" },
      ]
      // proposal in elaboration or in VOTING
      if (this.law.poll !== undefined) return [
        { percent:  "5", above: moment(this.law.createdAt).format('L'), below: "created" },
        { percent: "33", above: moment(this.law.reachedQuorumAt).format('L'), below: "Quorum<br/>reached"},
        { percent: "66", above: moment(this.law.poll.votingStartAt).format('L'), below: "Voting<br/>start"},
        { percent: "95", above: moment(this.law.poll.votingEndAt).format('L'), below: "Voting<br/>end"}    
      ]
      if (this.law.status === "PROPOSAL") return [
        { percent:  "5", above: moment(this.law.createdAt).format('L'), below: "created" },
        { percent: "90", above: moment(this.law.reachedQuorumAt).format('L'), below: "Quorum<br/>reached"},
      ]      
      //MAYBE: if (this.law.status === "LAW")
      if (this.law.status === "RETENTION") {
        //TODO: show how long until retracted
      }
    }
  },

  methods: {
    getFromNow: function(dateVal) {
      return moment(dateVal).fromNow();
    },
    
    likeToDiscuss() {
      this.$root.api.addSupporterToIdea(this.law, this.$root.currentUser).then(res => {
        console.log(res)
        //BUGFIX:  cannot simply update this.law, becasue Vue properties should not be updated. So we fire an event to parent instead:
        this.$emit("like", this.law)  // notify parent to reload this law
        //console.log("User "+this.$root.currentUser.email+", likes to discuss '"+this.law.title+"' => event emmited")
      })
    },

    /** get the link for the title of the idea, proposal or law */
    getLinkToLaw() {
      //TODO: Should I manage these frontend URL in a central place? MAYBE in confg/dev.env.js
      switch(this.law.status) {
        case 'IDEA':     return '/idea/'+this.law.id
        case 'LAW':      return '/law/'+this.law.id
        default:         return '/proposal/'+this.law.id   // PROPOSAL, ELABORATION
      }
    },

    getLawDescriptionStyle() {
      if (!this.fixedHeight) return ""
      return "min-height: "+this.fixedHeight+"px; max-height: "+this.fixedHeight+"px; overflow-y: scroll; overflow-x: hidden;"
    },

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
  .lawFooterTable {
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
