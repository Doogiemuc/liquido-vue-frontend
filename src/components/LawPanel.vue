<template>
	<div v-if="law" class="panel panel-default lawPanel" :data-proposaluri="getProposalURI">
    <div class="panel-heading">
      <router-link v-if="!readOnly" :to="getLinkToLaw()" role="button" class="btn btn-default btn-xs pull-right">
        <i class="fas fa-angle-double-right"></i>
      </router-link>
			<h4 class="lawTitle">
          <i class="fa" :class="getIconForLaw" aria-hidden="true"></i>
          {{law.title}}
      </h4>
    </div>
    <div class="panel-body lawDescription" :style="getLawDescriptionStyle()">
      <div v-html="law.description"></div>
      <timeline v-if="showTimeline" :height="60" :events="timelineEvents"></timeline>
    </div>
		<div class="panel-footer">
			<table class="table lawFooterTable">
				<tbody>
					<tr>
						<td><img :src="law.createdBy.profile.picture" class="media-object userPicture"></td>
						<td class="userDataSmall">
							<i class="far fa-fw fa-user" aria-hidden="true"></i>&nbsp;{{law.createdBy.profile.name}}<br/>
							<i class="far fa-fw fa-clock" aria-hidden="true"></i>&nbsp;{{getFromNow(law.createdAt)}}
						</td>
						<td class="userDataSmall">
              <i class="far fa-fw fa-bookmark" aria-hidden="true"></i>&nbsp;{{law.area.title}}<br/>
              <i v-if="law.poll !== null" class="fas fa-balance-scale"></i>&nbsp;
              <router-link v-if="law.poll !== null && !readOnly" :to="'/polls/'+law.poll.id">Poll</router-link>
              <span v-if="law.poll !== null && readOnly">Poll</span>
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
    getIconForLaw: function() {
      switch(this.law.status) {
        case "IDEA":    return { "far": true, "fa-lightbulb": true }
        case "LAW":     return { "fa-university": true }  // or balance-scale?
        default:        return { "fa-file-alt": true }  // proposal etc
      }
    },

    createdByCurrentUser: function() {
      return this.$root.currentUser.id == this.law.createdBy.id
    },

    timelineEvents() {
      if (this.law.status === "IDEA") return [
        { percent: "5", above: moment(this.law.createdAt).format('L'), below: "created" },
      ]
      if (this.law.status === "PROPOSAL") return [
        { percent:  "5", above: moment(this.law.createdAt).format('L'), below: "created" },
        { percent: "90", above: moment(this.law.reachedQuorumAt).format('L'), below: "Quorum<br/>reached"},
      ]
      if (this.law.status === "ELABORATION" || this.law.status === "VOTING") return [    // implies    this.law.poll !== undefined && this.law.poll !== null
        { percent:  "5", above: moment(this.law.createdAt).format('L'), below: "created" },
        { percent: "33", above: moment(this.law.reachedQuorumAt).format('L'), below: "Quorum<br/>reached"},
        { percent: "66", above: moment(this.law.poll.votingStartAt).format('L'), below: "Voting<br/>start"},
        { percent: "95", above: moment(this.law.poll.votingEndAt).format('L'), below: "Voting<br/>end"}
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
  .lawFooterTable {
		margin: 0;
		padding: 0;
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
    vertical-align: middle;
  }
  .likeButtonCell {
    text-align: right;
		vertical-align: middle;
  }

</style>
