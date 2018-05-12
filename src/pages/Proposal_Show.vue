<template>
  <div v-if="proposal === null" class="container">
    <h1>Loading ...</h1>
  </div>
  <div v-else class="container">
		<h1>Proposal
			<template v-if="proposal.poll && proposal.poll.status === 'ELABORATION'">in elaboration</template>
			<template v-if="proposal.poll && proposal.poll.status === 'VOTING'">in voting phase</template>
		</h1>

		<law-panel v-if="proposal" :law="proposal" :showTimeline="true" class="proposalPanel"></law-panel>
		
		<h4>Suggestions for improvement</h4>
    <hr/>

    <div v-for="comment in comments" class="media">
      <div class="media-left">
        <img :src="comment.createdBy.profile.picture" />
      </div>
      <div class="media-body">
        <div class="comment">
	        <span class="pull-right">
	          <span v-if="comment.upvotedByCurrentUser">
	          	<i class="fas fa-thumbs-up alreayUpvoted"></i> {{comment.upVotes}}&nbsp;
	          	<i class="fas fa-thumbs-down alreadyVotedInactive"></i> {{comment.downVotes}}
	          </span>
	          <span v-else-if="comment.downvotedByCurrentUser">
	            <i class="fas fa-thumbs-up alreadyVotedInactive"></i> {{comment.upVotes}}&nbsp;
	            <i class="fas fa-thumbs-down alreayDownvoted"></i> {{comment.downVotes}}
	          </span>
	          <span v-else class="commentIcon">
	            <span v-on:click="upvoteComment(comment)"><i class="fas fa-thumbs-up"></i> {{comment.upVotes}}</span>&nbsp;
	            <span v-on:click="downvoteComment(comment)"><i class="fas fa-thumbs-down"></i> {{comment.downVotes}}</span>
	          </span>
	        </span>
	        <small class="text-muted">{{comment.createdBy.profile.name}} suggested {{getFromNow(comment.createdAt)}}</small>
	        <p>{{comment.comment}}</p>
        </div>
				<div v-for="reply in comment.replies" class="media reply">
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
	      <div class="media reply">
		      <div class="media-left">
		        <img :src="currentUser.profile.picture" />
		      </div>
		      <div class="media-body">
			      <div class="input-group col-xs-12 col-md-6">
						  <input type="text" class="form-control input-sm" name="reply" :id="'replyTo'+comment.id" v-model="replyText[comment.id]" placeholder="Reply to this suggestion" >
						  <span class="input-group-addon" v-on:click="replyToSuggestion(comment)"><i class="fas fa-reply commentIcon" title="reply to suggestion"></i></span>
						</div>
		      </div>
	      </div>
      </div>
      <hr/>
    </div>
    
		<div class="media">
      <div class="media-left">
        <img :src="currentUser.profile.picture" />
      </div>
      <div class="media-body">
      
        <div class="input-group col-xs-12 col-md-8">
				  <input type="text" class="form-control" v-model="suggestionText" placeholder="Suggest a new improvement">
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
import timeline from '../components/Timeline'



//
//TODO:  Very nice RESPONSIVE layout for comments: https://bootsnipp.com/snippets/featured/comment-posts-layout
//




export default {
	props: {
		'proposalId': { type: String, required: true }
	},
	
	data () {
    return {
      proposal: null,
      comments: null,
      replyText: [],
      suggestionText: ""
		}
	},
	
	components: {
		timeline: timeline,
		'law-panel': LawPanel
	},
	
	
	computed: {
		ideaCreated: function() { return moment(this.proposal.createdAt).format('L') },
		reachedQuorumAt: function() { return moment(this.proposal.reachedQuorumAt).format('L') },
		votingStart : function() { return moment(this.proposal.poll.votingStartAt).format('L') },
		votingEnd   : function() { return moment(this.proposal.poll.votingEndAt).format('L') },
		timelinePercentFilled: function() {
			var start = new Date(this.proposal.createdAt)
			var end   = new Date(this.proposal.poll.votingEndAt)
			var percent = timeline.methods.date2percent(new Date(), start, end)
			console.log("=== calculdated percent", start, end, percent)
			return percent
		},
		timelineEvents: function() {
		  return [ 
        { percent: "5",  above: this.ideaCreated, below: "Idea<br/>created"},  //TODO: make it possible to pass dates instead of percentage values
        { percent: "50", above: this.reachedQuorumAt, below: "Voting</br>start"},
        { percent: "95", above: this.votingEnd, below: "Voting<br/>end"},
      ]
		},
		currentUser: function() { return this.$root.currentUser }

	},
	

  methods: {
		/** get localized display Value of a date */
    getFromNow: function(dateVal) {					//MAYBE: Make this a VueJS filter and the use {{value | fromNow}}
      return moment(dateVal).fromNow()
    },

    createdByCurrentUser(comment) {
    	return this.$root.currentUser.id === comment.createdBy.id
    },

		upvoteComment(comment) {
			this.$root.api.upvoteComment(comment, this.$root.currentUserURI).then(res => {
				this.reloadComments()
			})
		},

		downvoteComment(comment) {
			this.$root.api.downvoteComment(comment, this.$root.currentUserURI).then(res => {
				this.reloadComments()
			})
		},

    /** compare two comments by their number of upvotes */
		commentComparator(c1, c2) {
			return c2.upVotes - c1.upVotes
		},

		reloadComments() {
			this.$root.api.noCacheForNextRequest()
			this.$root.api.getComments(this.proposal, true).then(comments => { 
				this.comments = comments.slice(0,10).sort(this.commentComparator)		//sort comments by votes and limit to 10 comments and 20 replies max
				this.replyText = []
				this.suggestionText = ""
			})	
		},

		replyToSuggestion(comment) {
			if (!this.replyText[comment.id]) return;
			//console.log("replyToSuggestion: "+this.replyText)
			//Would also work:  var newReplyText = $('#replyTo'+comment.id).val() 
			this.$root.api.saveComment(this.replyText[comment.id], comment, this.$root.currentUserURI).then(res => {
				this.reloadComments() 
				this.replyText = []
			})
		},

		addNewSuggestion() {
			if (!this.suggestionText) return;
			this.$root.api.suggestImprovement(this.suggestionText, this.proposal).then(res => {
				this.reloadComments()
				this.suggestionText = ""
			})
		}

  },
	
	created () {
		this.$root.api.getProposal(this.proposalId, /*load projection*/true).then(proposal => { 
			this.proposal = proposal
			this.reloadComments()
		})
		
	},
}
</script>

<style scoped>
.comment:hover {
  background: #F3F3F3;
}
.reply:hover {
	background: #F3F3F3;
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

