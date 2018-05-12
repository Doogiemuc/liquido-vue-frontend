<template>
  <div class="container">
		<h1>Poll
			<template v-if="poll.status === 'ELABORATION'">in elaboration phase</template>
			<template v-if="poll.status === 'VOTING'">in voting phase</template>
		</h1>
			
	  <p v-if="poll.status === 'ELABORATION'">
			Voting will start on {{votingStart}}
		</p>
		<p v-if="poll.status === 'VOTING'">
			{{votingEnd}} until voting phase ends.
		</p>
		
		<timeline :height="60" :percentFilled="timelinePercentFilled" :events="timelineEvents"></timeline>

		
		<h4>Alternative proposals in this poll</h4>
		
    <div class="row">
		  <div class="col-sm-6" v-for="proposal in poll._embedded.proposals">
				<law-panel 
				  :law="proposal" 
				  :showTimeline="false" 
				  :fixedHeight="200"
				  v-on:like="likeToDiscuss"
				  class="proposalPanel" 
				></law-panel>
			</div>
		</div>
	</div>	
</template>

<script>
import moment from 'moment'
import LawPanel from '../components/LawPanel'
import timeline from '../components/Timeline'

export default {
	props: {
		'pollId': { type: String, required: true }
	},
	
	data () {
    return {
      poll: { _embedded: { proposals: [] }}
		}
	},
	
	components: {
		timeline: timeline,
		'law-panel': LawPanel
	},
	
	computed: {
		pollCreated : function() { return moment(this.poll.createdAt).format('L') },
		votingStart : function() { return moment(this.poll.votingStartAt).format('L') },
		votingEnd   : function() { return moment(this.poll.votingEndAt).format('L') },
		timelinePercentFilled: function() { return 30 },
		timelineEvents: function() {
		  return [ 
        { percent: "5",   above: this.pollCreated, below: "Poll<br/>created" },
        { percent: "50",  above: this.votingStart, below: "Voting</br>start" },
        { percent: "95", above: this.votingEnd, below: "Voting<br/>end" }
      ]
		}
	},

  methods: {
		/** get localized display Value of a date */
    getFromNow(dateVal) {
      return moment(dateVal).fromNow();
    },

		/** 
		 * When a user likes a proposal, then we update its properties
		 * (a little bit of a small dirty hack, but better than reloading the whole poll from the backend)
		 */
  	likeToDiscuss(likedProposal) {
  		this.poll._embedded.proposals.forEach(proposal => {
  			if (proposal.id === likedProposal.id) {
  				proposal.numSupporters++
  				proposal.supportedByCurrentUser = true
  			}
  		})
  		
  	},
  },
	
	created () {
		this.$root.api.getPoll(this.pollId).then(poll => { 
			this.poll = poll
		})
	},
}
</script>

<style scoped>
</style>

