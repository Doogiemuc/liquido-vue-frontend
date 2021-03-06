<template>
	<div class="panel panel-default pollPanel" :data-polluri="getPollURI">
		<div class="panel-heading">
			<router-link :to="'/polls/'+poll.id" class="pollLink">
				<button class="btn btn-primary btn-xs pull-right">
					<i class="fas fa-angle-double-right"></i>
				</button>
				<h4 class="pollTitle"><i class="fas fa-balance-scale-left"></i>&nbsp;{{poll.title}}</h4>
			</router-link>
		</div>
		<div class="panel-body poll-list" :id="pollPanelID">
			<div v-for="(proposal, index) in poll._embedded.proposals" :key="proposal.id">
				<h4 class="proposalTitle collapsedTitle" :class="{ firstHeader: isFirst(index), lastHeader: isLast(index) }">{{proposal.title}}</h4>
				<p class="collapse">{{proposal.description}}</p>
				<p class="pfooter collapse">
					<i class="far fa-user"></i> {{proposal.createdBy.profile.name}}&nbsp;&nbsp;
					<i class="far fa-clock"></i> {{getFromNow(proposal.createdAt)}}&nbsp;&nbsp;
					<i class="far fa-bookmark"></i> {{proposal.area.title}}&nbsp;&nbsp;
					<i class="far fa-thumbs-up"></i> {{proposal.numSupporters}}
				</p>
			</div>
			<div class="expandButton" v-on:click="toggleCollapse">
				<i class="fas fa-caret-down"></i>
			</div>
		</div>
		<div class="panel-footer footerSmall">
			<i class="far fa-clock"></i>&nbsp;{{getFromNow(poll.createdAt)}}&nbsp;&nbsp;
			<i class="far fa-bookmark"></i>&nbsp;{{poll._embedded.proposals[0].area.title}}&nbsp;&nbsp;
			<i class="fas fa-balance-scale-left"></i>&nbsp;{{poll.status}}&nbsp;&nbsp;
		</div>
	</div>

</template>

<script>
var moment = require('moment');

export default {
	props: {
		'poll': { type: Object, required: true }
	},

	data () {
		return {
      		pollPanelID: "Poll_"+this.poll.id+"_"+Date.now() // unique UID for this poll panel
		}
	},

	computed: {
		getPollURI() {
			return this.$root.api.getURI(this.poll)
		}
	},

  	methods: {
		/** get localized display Value of a date */
    	getFromNow: function(dateVal) {
      		return moment(dateVal).fromNow();
    	},

		isFirst(index) {
			return index === 0
		},

		isLast: function(index) {
			return index === this.poll._embedded.proposals.length - 1
		},

		/**
		 * open or collapse the description of the proposals in a poll
		 * And toggle the expand/collapse icon   (Needs some fontawesome SVG magic *G*)
		 */
		toggleCollapse(evt) {
			$('#'+this.pollPanelID+' .collapse').collapse('toggle')
			$('#'+this.pollPanelID+' .proposalTitle').toggleClass('collapsedTitle');
			$(evt.currentTarget)
			  .find('[data-fa-i2svg]')
        .toggleClass('fa-caret-up')
        .toggleClass('fa-caret-down');

		}
  	},

	mounted () {
		$('#'+this.pollPanelID+' .collapse').collapse('hide')
	},

	filters: {
		// returns a localized version of dateValue, e.g. 15.03.2016 for DE-DE
		localizeDate(dateVal) {
			return moment(dateVal).format('L');
		},
	}
}
</script>

<style scoped>
	.pollPanel .panel-heading h4 {
		margin-top: 0;
		margin-bottom: 0;
	}
	.pollPanel .panel-body .firstHeader {
		margin-top: 0;
	}
	.pollPanel .panel-body .lastHeader {
		margin-bottom: 0;
	}
	.pollPanel .collapsedTitle {
	 	font-size: 14px;
		font-weight: normal;
	}
	.pollPanel .footerSmall {
		padding-top: 5px;
		padding-bottom: 5px;
		color: #999;
		font-size: 12px;
		/*line-height: 1.4;*/
  	}
	.poll-list {
		padding: 10px;
	}
  	.poll-list p {
    	margin: 0;
	}
	.poll-list .pfooter {
		text-align: right;
		color: #999;
		font-size: 12px;
	}
	.pollPanel {
		position: relative;
	}
	.expandButton {
		position: absolute;
		color: #ddd;
		bottom: 0;
		right: 5px;
}
</style>

