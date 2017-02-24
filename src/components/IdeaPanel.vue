<template>
	<div class="panel panel-default">

    <div class="panel-body">
      <i class="pull-right fa fa-lightbulb-o ideaIcon grey" aria-hidden="true"></i>
      <h4>{{idea.title}}</h4>
      <p>{{idea.description}}</p>
    </div>

    <div class="panel-footer">
      <div class="media">
        <div class="media-left"><img src="/static/img/Avatar_32x32.jpeg" class="media-object userPicture"></div>
        <div class="media-body userDataSmall">
          <span v-if="idea.supportedByCurrentUser" class="green pull-right">
            <span class="fa fa-thumbs-o-up" aria-hidden="true"></span> {{idea.numSupporters}}
          </span>
          <span v-else>
            <a v-on:click.prevent="likeToDiscuss(idea)" href="#" role="button" class="btn btn-default pull-right">
              <span class="fa fa-thumbs-o-up" aria-hidden="true"></span> {{idea.numSupporters}}
            </a>
          </span>
          <i class="fa fa-user" aria-hidden="true"></i>&nbsp;{{idea.createdBy.profile.name}}<br>
          <i class="fa fa-clock-o" aria-hidden="true"></i>&nbsp;{{getFromNow(idea.createdAt)}}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<i class="fa fa-bookmark" aria-hidden="true"></i>&nbsp;{{idea.area.title}}             
        </div>
      </div>

    </div>

  </div>

</template>

<script>
var moment = require('moment');

export default {
	props: ['idea'],

  methods: {
    getFromNow: function(dateVal) {
      return moment(dateVal).fromNow();
    },
  
    likeToDiscuss(idea) {
      console.log("User "+this.$root.currentUser.email+", likes to discuss '"+idea.title+"'")
      this.$root.api.addSupporter(idea, this.$root.currentUser)
      .then(result => {
        //completely reload idea.  This will also solve the side case, when user is already a supporter
        // about projections: http://stackoverflow.com/questions/15886897/how-do-i-avoid-n1-queries-with-spring-data-rest
        this.$root.api.getIdea(idea).then(res => {
          this.idea = res
        })
      })
    }
  }
}
</script>

<style scoped>
  .ideaIcon {
  	font-size: 30px;
  }
  .green {
    font-color: green;
  }
  .ideaTitle {
    margin-top: 0;
    margin-bottom: 0;
  }
</style>

