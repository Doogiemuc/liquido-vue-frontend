<template>
  <div class="container">
		<h1>Poll
			<template v-if="poll.status === 'ELABORATION'">in elaboration phase</template>
			<template v-if="poll.status === 'VOTING'">in voting phase</template>
		</h1>
			
	  <p v-if="poll.status === 'ELABORATION'">
			Voting will start in {{daysUntilVotingStart}} days.
		</p>
		<p v-if="poll.status === 'VOTING'">
			{{daysUntilVotingEnd}} days left to cast your vote.
		</p>
		
		<timeline :timelineData="timelineData" style="width:80%"></timeline>

		<br/>
		
		<h4>Alternative proposals in this poll</h4>
		
    <div class="row">
		  <div class="col-sm-6" v-for="proposal in poll._embedded.proposals">
				<law-panel :law="proposal" :showTimeline="false" class="proposalPanel"></law-panel>
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
		daysUntilVotingStart: function() { return moment(this.poll.votingStartAt).fromNow() },
		daysUntilVotingEnd  : function() { return moment(this.poll.votingEndAt).fromNow() },
		timelineData: function() {
		  return {
				percentFilled: "30",
        events: [ 
          { percent: "0",   above: this.pollCreated, below: "Poll<br/>created"},  //TODO: make it possible to pass dates instead of percentage values
          { percent: "50",  above: this.votingStart, below: "Voting</br>starts"},
          { percent: "100", above: this.votingEnd, below: "Voting<br/>ends"}
        ]
			}
		}
	},

  methods: {
		/** get localized display Value of a date */
    getFromNow: function(dateVal) {
      return moment(dateVal).fromNow();
    },

		/**
		 * get URI from poll object 
		 */
		getPollURI: function(poll) {
    	return this.$root.api.getURI(poll)
    },
		
  },
	
	created () {
		this.$root.api.getPoll(this.pollId).then(poll => { 
			this.poll = poll
		})
	},
}
</script>

<style>
 .lawDescription {
		min-height: 200px;
		max-height: 200px;
		overflow-y: scroll;
		overflow-x: hidden;
	}
</style>

