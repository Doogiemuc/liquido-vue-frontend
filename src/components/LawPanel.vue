<template>
	<div v-if="law" class="panel panel-default lawPanel" :data-proposaluri="getProposalURI">
    <div class="panel-heading">
      <h4 class="lawTitle" v-if="readOnly">
        <i class="fa" :class="iconForLaw" aria-hidden="true"></i>
        {{law.title}}
      </h4>
      <router-link v-if="!readOnly" :to="getLinkToLaw()">
  			<h4 class="lawTitle">
          <i class="fa" :class="iconForLaw" aria-hidden="true"></i>&nbsp;{{law.title}}
        </h4>
      </router-link>
    </div>
    <div class="panel-body lawDescription" :style="getLawDescriptionStyle()">
      <div v-html="law.description"></div>
      <timeline v-if="showTimeline" :height="80" :fillToDate="new Date()" :events="timelineEvents"></timeline>
    </div>
		<div class="panel-footer">
			<table class="table lawFooterTable">
				<tbody>
					<tr>
						<td><img :src="law.createdBy.profile.picture" class="media-object avatarImg"></td>
						<td class="userDataSmall">
							<i class="far fa-fw fa-user"  aria-hidden="true"></i>&nbsp;{{law.createdBy.profile.name}}<br/>
							<i class="far fa-fw fa-clock" aria-hidden="true"></i>&nbsp;{{getFromNow(law.createdAt)}}
						</td>
						<td class="userDataSmall">
							<i class="far fa-fw fa-bookmark" aria-hidden="true"></i>&nbsp;{{law.area.title}}<br/>
							<span v-if="law.poll !== null">
								<i class="fas fa-balance-scale"></i>&nbsp;Poll({{law.poll.numCompetingProposals}})
							</span>
						</td>
						<td class="userDataSmall">
							<i class="fa fa-fw" :class="iconForLaw" aria-hidden="true"></i>&nbsp;{{statusLoc}}
						</td>
						<td class="likeButtonCell">
							<support-button :law="law" v-on:like="likeToDiscuss" :readOnly="readOnly || createdByCurrentUser"></support-button>
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
    'law' : { type: Object, required: true },                 // the idea, proposal or law we show in a bootstrap panel
    'showTimeline' : { type: Boolean, required: false, default: function() { return true } }, // whether to show a timeline
    'fixedHeight' : { type: Number, required: false, default: function() { return undefined } },  // fixed height of lawDescription, can be used  to make several LawPanels all the same height.
    'readOnly' : { type: Boolean, required: false, default: function() { return false } },   // if true, then no links and inactive supportButton
  },

  components: {
		'timeline': timeline,
		'support-button': SupportButton
	},

  computed: {
    getProposalURI() {
      return this.$root.api.getURI(this.law)
    },

    // dynamically set icon depending on law.status
    // BUGFIX: Must be a computed prop. Not a method!
    iconForLaw() {
      switch(this.law.status) {
        case "IDEA":    return { "far": true, "fa-lightbulb": true }
        case "LAW":     return { "fa-university": true }  // or balance-scale?
        default:        return { "fa-file-alt": true }  // proposal etc
      }
    },

    statusLoc() {
      switch(this.law.status) {
        case "IDEA":        return "Idea"
        case "PROPOSAL":    return "Proposal"
        case "ELABORATION": return "Proposal in elaboration"
        case "VOTING":      return "Proposal in voting"
        case "LAW":         return "Law"
        case "DROPPED":     return "Dropped law"
        case "RETENTION":   return "Law in retention"
        case "RETRACTED":   return "Rectracted law"
	  }
	  return "<unknown>";
    },

    createdByCurrentUser() {
      return this.$root.currentUser.id == this.law.createdBy.id
    },

    timelineEvents() {
		var events = [
			{ percent: 10, date: new Date(this.law.createdAt), above: moment(this.law.createdAt).format('L'), below: "created" }
		]
		if (this.law.status === "IDEA") {
			// add no event
		} else
    	if (this.law.status === "PROPOSAL") {
			events.push(
				{ percent: 90, date: new Date(this.law.reachedQuorumAt), above: moment(this.law.reachedQuorumAt).format('L'), below: "Quorum<br/>reached"}
			)
		} else {
			events.push(
        		{ percent: 33, date: new Date(this.law.reachedQuorumAt), above: moment(this.law.reachedQuorumAt).format('L'), below: "Quorum<br/>reached"},
        		{ percent: 66, date: new Date(this.law.poll.votingStartAt), above: moment(this.law.poll.votingStartAt).format('L'), below: "Voting<br/>start"},
        		{ percent: 90, date: new Date(this.law.poll.votingEndAt), above: moment(this.law.poll.votingEndAt).format('L'), below: "Voting<br/>end"}
			)
		}
    	//MAYBE: if (this.law.status === "LAW")
    	if (this.law.status === "RETENTION") {
        	//TODO: show how long until retracted
		}
		return events
    }
  },

  methods: {
    getFromNow: function(dateVal) {
      return moment(dateVal).fromNow();
    },

    /** event from SupportButton */
    likeToDiscuss() {
      this.$root.api.addSupporterToIdea(this.law, this.$root.currentUser).then(res => {
        iziToast.success({
          title: 'Liked!',
          message: 'Thank you for supporting this.',
        });
        //BUGFIX:  cannot simply update this.law, becasue Vue properties should not be updated. So we fire an event to parent instead:
        this.$emit("like", this.law)  // notify parent to reload this law
      })
    },

    /** get the link for the title of the idea, proposal or law */
    getLinkToLaw() {
      //TODO: Should I manage these frontend URL in a central place? MAYBE in confg/dev.env.js
      switch(this.law.status) {
        case 'IDEA':     return '/ideas/'+this.law.id
        case 'LAW':      return '/laws/'+this.law.id
        default:         return '/proposals/'+this.law.id   // PROPOSAL, ELABORATION
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
    margin-right: 0.2em;
  }
  .lawTitle {
    margin-top: 0;
    margin-bottom: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .lawPanel .panel-footer {
    padding-top: 3px;
    padding-bottom: 3px;
  }
  .avatarImg {
    width: 32px;
    height: 32px;
  }
  .lawFooterTable {
		margin: 0;
		padding: 0;
    background-color: transparent;
  }
  .lawFooterTable td {
    margin: 0;
	padding: 0;
	border: none;
  }
  .userDataSmall {
    color: #999;
    font-size: 12px;
    line-height: 1.4;
  }
  .likeButtonCell {
    text-align: right;
		vertical-align: middle;
  }

</style>
