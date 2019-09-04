<template>
  <div v-if="!this.proposal" class="container">
	<h1>Proposal</h1>
	<div v-if="proposal === null" class="container">
		<span v-html="loadingMessage"></span>
	</div>
  </div>
  <div v-else class="container" id="ProposalShow">
  	<h1>{{statusLoc}}</h1>

	<law-panel v-if="proposal" :law="proposal" :readOnly="showAsReadOnly" :showTimeline="proposal.status !== 'IDEA'" class="proposalPanel"></law-panel>

    <div v-if="createdByCurrentUser" class="panel panel-default">
	    <div class="panel-heading">
			<h4 class="panelTitle">This is your {{nameByStatus}}</h4>
	    </div>
	    <div class="panel-body">
	    	<div v-if="proposal.status === 'IDEA'">
	    		<p>Your idea now needs at least {{$root.props['liquido.supporters.for.proposal']}} supporters to reach its quorum. Then your idea
	    		will become a proposal that can be further discussed.</p>
	    		<p><button type="button" class="btn btn-sm btn-default" @click="$router.push('/ideas/'+proposal.id+'/edit')">Edit your idea</button></p>
	    	</div>
	      <div v-else-if="proposal.status === 'PROPOSAL'">
	      	<p>Your idea reached its quorum and now became a proposal. It can now be discussed. You should carefully consider and respect the suggestions for improvements below. They come from your potential voters. <router-link :to="'/ideas/'+proposal.id+'/edit'">Update your proposal</router-link> to reflect the latest consens. Then you can either </p>
	        <ul class="startJoinList">
	        	<li><button type="button" class="btn btn-sm btn-default" id="joinPollButton" style="width:20ch" @click="joinPoll">Join an existing poll</button> - Search for an existing poll in ELABORATION and then add your proposal to it as an alternative suggestion.</li>
	        	<li><button type="button" class="btn btn-sm btn-default" id="startNewPollButton" style="width:20ch" @click="startNewPoll">Start a new poll</button> - Then you then need alternative suggestions before the voting phase of the new poll can start.</li>
			</ul>
	      </div>
	      <div v-else-if="proposal.status === 'ELABORATION'">
	        <p>Your proposal is now part of a <router-link :to="'/polls/'+proposal.poll.id">Poll</router-link>. Users can still suggest improvements to your proposal. Take a look at them. Feel free to comment. And ideally edit and improve your proposal for your voters until voting starts.
	        Once the voting phase starts, you cannot edit your proposal anymore.</p>
	        <p><button type="button" class="btn btn-sm btn-default" @click="editProposal()">Edit your proposal</button></p>
	      </div>
	      <div v-else-if="proposal.status === 'VOTING'">
	      	<button type="button" id="goToPollButton" class="btn btn-default btn-sm pull-right" @click="goToPoll()">Go to poll
 				<i class="fas fa-angle-double-right"></i>
	  		</button>
	        <p>Voting has started. Good luck in the poll.</p>
	      </div>
	    </div>
	</div>
	<div v-else class="panel panel-default" id="infoPanel">
	    <div class="panel-body">
	    	<div v-if="proposal.status === 'IDEA'">
	    		<p>This idea needs at least {{$root.props['liquido.supporters.for.proposal']}} supporters to reach its quorum. Then it
	    		will become a proposal that can be discussed.</p>
	    	</div>
	    	<div v-else-if="proposal.status === 'PROPOSAL'">
	  			<p>This idea got enough supporters so it became a proposal. It can now be discussed further. You may suggest
	  			improvements to the proposal's author below.</p>
	  		</div>
	  		<div v-else-if="proposal.status === 'ELABORATION'">
	  			<button type="button" id="goToPollButton" class="btn btn-default btn-sm pull-right" @click="goToPoll()">Back to poll
 					<i class="fas fa-angle-double-right"></i>
	  			</button>
	  			<p>This proposal is part of a poll in elaboration phase. It can still be discussed. You may suggest	improvements to the proposal's author below.</p>
	  		</div>
	  		<div v-else-if="proposal.status === 'VOTING'">
	  			<button type="button" id="goToPollButton" class="btn btn-default btn-sm pull-right" @click="goToPoll()">Go to poll
 						<i class="fas fa-angle-double-right"></i>
	  			</button>
	  			<p>This proposal is part of a poll in voting. You can cast your vote in the poll.</p>
	  		</div>
	  	</div>
	</div>

	<div v-if="showComments">
		<h4 >Suggestions for improvement</h4>

    	<div v-for="comment in comments" :key="comment.id" class="media">
	  
			<div class="media-left">
				<img :src="comment.createdBy.profile.picture" />
			</div>
			<div class="media-body">

				<div class="comment">
					<span class="pull-right">
						<span v-if="comment.replies.length === 0">
						<span v-on:click="showReplyInput(comment)"><i class="fas fa-reply replyHoverIcon" ></i>&nbsp;</span>&nbsp;&nbsp;
					</span>
					<span v-if="comment.upvotedByCurrentUser">
						<i class="fas fa-thumbs-up alreayUpvoted"></i> {{comment.upVotes}}&nbsp;
						<i class="fas fa-thumbs-down alreadyVotedInactive"></i> {{comment.downVotes}}
					</span>
					<span v-if="comment.downvotedByCurrentUser">
						<i class="fas fa-thumbs-up alreadyVotedInactive"></i> {{comment.upVotes}}&nbsp;
						<i class="fas fa-thumbs-down alreayDownvoted"></i> {{comment.downVotes}}
					</span>
					<span v-if="!comment.upvotedByCurrentUser && !comment.downvotedByCurrentUser" class="commentIcon">
						<span v-on:click="upvoteComment(comment)"><i class="fas fa-thumbs-up"></i> {{comment.upVotes}}</span>&nbsp;
						<span v-on:click="downvoteComment(comment)"><i class="fas fa-thumbs-down"></i> {{comment.downVotes}}</span>
					</span>
					</span>
					<small class="text-muted">{{comment.createdBy.profile.name}} suggested {{getFromNow(comment.createdAt)}}</small>
					<p>{{comment.comment}}</p>
				</div>

				<div v-for="reply in comment.replies" :key="reply.id" class="media reply">
					<div class="media-left">
						<img class="replyUserImg" :src="reply.createdBy.profile.picture" />
					</div>
					<div class="media-body">
						<span class="pull-right">
							<span v-if="reply.upvotedByCurrentUser">
								<i class="fas fa-thumbs-up alreayUpvoted"></i> {{reply.upVotes}}&nbsp;
								<i class="fas fa-thumbs-down alreadyVotedInactive"></i> {{reply.downVotes}}
							</span>
							<span v-else-if="reply.downvotedByCurrentUser">
								<i class="fas fa-thumbs-up alreadyVotedInactive"></i> {{reply.upVotes}}&nbsp;
								<i class="fas fa-thumbs-down alreayDownvoted"></i> {{reply.downVotes}}
							</span>
							<span v-else class="commentIcon">
								<span v-on:click="upvoteComment(reply)"><i class="fas fa-thumbs-up"></i> {{reply.upVotes}}</span>&nbsp;
								<span v-on:click="downvoteComment(reply)"><i class="fas fa-thumbs-down"></i> {{reply.downVotes}}</span>
							</span>
						</span>
						<small class="text-muted">{{reply.createdBy.profile.name}} commented {{getFromNow(reply.createdAt)}}</small>
						<p>{{reply.comment}}</p>
					</div>
				</div>

				<div v-if="discussionIsOpen && (comment.replies.length > 0 || comment.showReplyInput)" class="media reply">
					<div class="media-left">
						<img class="replyUserImg" :src="currentUser.profile.picture" />
					</div>
					<div class="media-body">
						<div class="input-group col-xs-12 col-md-6">
							<input type="text" class="form-control input-sm" name="reply" :id="'replyTo'+comment.id"
								v-model="replyText[comment.id]" v-on:keyup.enter="replyToSuggestion(comment)" placeholder="Your reply" >
							<span class="input-group-addon" v-on:click="replyToSuggestion(comment)"><i class="fas fa-reply commentIcon" title="reply to suggestion"></i></span>
						</div>
					</div>
				</div>

			</div>
    		<hr class="commentSeparator" />
		</div>
	</div>

	<div v-if="showComments && discussionIsOpen" class="media">
      <div class="media-left">
        <img :src="currentUser.profile.picture" />
      </div>
      <div class="media-body">
        <div class="input-group col-xs-12 col-md-8">
			<input type="text" id="suggestImprovementInput" class="form-control" v-model="suggestionText"
				v-on:keyup.enter="addNewSuggestion()" placeholder="Suggest a new improvement">
				<span class="input-group-addon" v-on:click="addNewSuggestion()" id="save-suggestion"><i class="fas fa-comment commentIcon" title="reply to suggestion"></i></span>
			</div>
      </div>
      <hr/>
    </div>

  </div>
</template>

<script>
import moment from 'moment'
import LawPanel from '../components/LawPanel'

export default {
	props: {
		'proposalId': { type: String, required: true }
	},

	data () {
		return {
			loadingMessage: "<h3>Loading ...</h3>",
			proposal: null,
			comments: null,
			replyText: [],
			suggestionText: ""
		}
	},

	components: {
		'law-panel': LawPanel
	},


	computed: {
		//TODO: localize translations
		statusLoc() {
			switch(this.proposal.status) {
				case "IDEA":        return "Idea"
				case "PROPOSAL":    return "Proposal"
				case "ELABORATION": return "Proposal in elaboration"
				case "VOTING":      return "Proposal in voting"
				case "LAW":         return "Law"
				case "DROPPED":     return "Dropped law"
				case "RETENTION":   return "Law in retention"
				case "RETRACTED":   return "Rectracted law"
			}
			return "<???>";
		},

		showAsReadOnly() {
			return this.proposal.status === 'DROPPED'
		},
		nameByStatus: function() {
			if (this.proposal.status === 'IDEA') return "idea"
			if (this.proposal.status === 'LAW' || this.proposal.status === "DROPPED") return "law"
			return "proposal"
		},
		ideaCreated: function() { return moment(this.proposal.createdAt).format('L') },
		reachedQuorumAt: function() { return moment(this.proposal.reachedQuorumAt).format('L') },
		currentUser: function() { return this.$root.currentUser },
		discussionIsOpen: function() {
			return this.proposal.status === 'PROPOSAL' || this.proposal.status === 'ELABORATION'
		},
		showComments: function() {
			return this.proposal.status !== 'IDEA'
		},
		createdByCurrentUser() {
    		return this.$root.currentUser.id === this.proposal.createdBy.id
    	},
	},


  	methods: {
		/** get localized display Value of a date */
		getFromNow: function(dateVal) {					//MAYBE: Make this a VueJS filter and the use {{value | fromNow}}
			return moment(dateVal).fromNow()
		},

		goToPoll() {
			this.$router.push('/polls/'+this.proposal.poll.id)
		},

		/** Create a new poll with the current proposal	*/
		startNewPoll() {
			this.$router.push({name: 'pollAdd', params: {
				proposal: this.proposal  // pass the proposal as full JSON
			}})
		},

		joinPoll() {
			this.$router.push({name: 'polls'})
		},

		upvoteComment(comment) {
			this.$root.api.upvoteComment(comment, this.$root.currentUser).then(res => {
				this.reloadComments()
			})
		},

		downvoteComment(comment) {
			this.$root.api.downvoteComment(comment, this.$root.currentUser).then(res => {
				this.reloadComments()
			})
			//TODO: comments with more than n downVotes should be deleted  (impl. in the backend)
		},

		/**
		 * Compare two comments
		 * 1. their number of upvotes (more upvotes at the top)
		 * 2. if votes equal (especially no up or downvotes) then compare by date created (newest suggestion at the bottom)
		 */
		commentComparator(c1, c2) {
			var comp = c2.upVotes - c1.upVotes
			if (comp == 0) {
				comp = c1.id - c2.id
			}
			return comp;
		},

		/** reload comments and their replies */
		reloadComments() {
			this.$root.api.getComments(this.proposal, true).then(comments => {
				this.comments = comments.sort(this.commentComparator)		//sort comments by votes and limit to 10 comments and 20 replies max
				this.replyText = []
				this.suggestionText = ""
			})
			.catch(err => {
				log.error("Cannot load comments for proposal.id="+this.proposal.id, err)
			})
		},

		/** add a new suggestion */
		addNewSuggestion() {
			if (!this.suggestionText) return;
			this.$root.api.suggestImprovement(this.suggestionText, this.proposal).then(res => {
				this.reloadComments()
				this.suggestionText = ""
			})
		},

		/** When user clicks on the reply button next to a suggestion, that does not yet have any replies, then show input for reply text */
		showReplyInput(comment) {
			this.$set(comment, 'showReplyInput', true)   // must use Vue's reactive setter, because we want to add a new (reactive) attribute to comment
		},

		/** save user's reply to a suggestion */
		replyToSuggestion(comment) {
			if (!this.replyText[comment.id]) return;
			//console.log("replyToSuggestion: "+this.replyText)
			//Would also work:  var newReplyText = $('#replyTo'+comment.id).val()
			this.$root.api.saveComment(this.replyText[comment.id], this.proposal, comment).then(res => {
				this.reloadComments()
				this.replyText = []
			})
		},

		//TODO: edit own comment

	},

	created () {
		this.$root.api.getProposal(this.proposalId, /*load projection*/true)
		.then(proposal => {
			this.proposal = proposal
			if (this.proposal.status !== 'IDEA') this.reloadComments()
		})
		.catch(err => {
			this.loadingMessage = "<h3>Error: Could not load proposal with id="+this.proposalId+"</h3><p><pre>"+JSON.stringify(err)+"</pre></p>"
			//TODO: use AlertPanel
		})

	},
}
</script>

<style scoped>
.panelTitle {
  margin-top: 0;
  margin-bottom: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
#infoPanel p:last-child {
	margin-bottom: 0;
}

.startJoinList {
	list-style: none
}
.startJoinList li {
	margin-bottom: 10px;
}

.comment:hover {
  background: #F3F3F3;
}

.replyHoverIcon {
	visibility: hidden;
}
.replyHoverIcon:hover {
	cursor: pointer;
}
.comment:hover .replyHoverIcon {
	visibility: visible;
}


.reply:hover {
	background: #F3F3F3;
}
.commentSeparator {
	border-top: 1px solid #aaa;
}
.commentIcon {
 	color: #666;
 	cursor: pointer;
}
.commentIcon:hover {
 	color: #000;
}
.reply {
	margin-top: 0;
}
.alreayUpvoted {
	color: #9C9;
}
.alreayDownvoted {
	color: #C99;
}
.alreadyVotedInactive {
	color: #CCC;
}
.replyUserImg {
	width: 33px;
	height: 33px;
}

</style>

