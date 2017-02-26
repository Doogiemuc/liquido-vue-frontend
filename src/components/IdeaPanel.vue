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
          <button v-if="idea.supportedByCurrentUser" type="button" class="btn btn-default btn-sm pull-right active supportedIdeaButton">
            <span class="fa fa-thumbs-o-up" aria-hidden="true"></span> {{idea.numSupporters}}
          </button>
          <button v-else type="button" class="btn btn-default btn-sm pull-right" v-on:click="likeToDiscuss(idea)">
            <span class="fa fa-thumbs-o-up" aria-hidden="true"></span> {{idea.numSupporters}}
          </button>
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
      //console.log("User "+this.$root.currentUser.email+", likes to discuss '"+idea.title+"'")
      this.$root.api.addSupporter(idea, this.$root.currentUser).then(res => {
        //BUGFIX:  cannot simply update this.idea, becasue Vue properties should not be updated. So we fire an event to parent instead:
        this.$emit("reloadIdea", idea)  // notify parent to reload idea  
      })
    }
  }
}
</script>

<style scoped>
  .ideaIcon {
  	font-size: 30px;
  }
  .supportedIdeaButton {
    background-color: #9C9;
  }
  .supportedIdeaButton:hover {
    background-color: #9C9;
    cursor: default;
  }
  .supportedIdeaButton:focus {
    background-color: #9C9;
    cursor: default;
  }
  .ideaTitle {
    margin-top: 0;
    margin-bottom: 0;
  }

</style>

