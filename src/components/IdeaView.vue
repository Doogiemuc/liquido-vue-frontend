<template>
	<div class="panel panel-default">
      <div class="panel-body">
        <div class="media">
          <div class="media-left"><img src="/static/img/Avatar_32x32.jpeg" class="media-object"></div>
          <div class="media-body">
            <div class="news_heading">
              <i class="pull-right fa fa-lightbulb-o ideaIcon" aria-hidden="true"></i>
              {{idea.createdBy.profile.name}} added a new idea.<br>
              {{getFromNow(idea.createdAt)}}&nbsp;&nbsp;&nbsp;&nbsp;
              <span class="glyphicon glyphicon-inbox" aria-hidden="true"></span> {{idea.area.title}}
            </div>
          </div>
        </div>
        <div>
          <h3>{{idea.title}}</h3>
          {{idea.description}}
        </div>
      </div>
      <div style="text-align: right;" class="panel-footer">
        <span v-bind:class="{ 'green' : supportedByCurrentUser }" >
          <span class="fa fa-thumbs-o-up" aria-hidden="true"></span> {{idea.numSupporters}}
          &nbsp;
        </span>
        <a v-if="!supportedByCurrentUser" v-on:click.prevent="likeToDiscuss(idea)" href="#" role="button" class="btn btn-default btn-xs">Like to discuss this!</a>
      </div>
    </div>
</template>

<script>
var moment = require('moment');
var RestClient = require('../services/RestClient.js')

export default {
	props: ['idea'],

  methods: {
    getFromNow: function(dateVal) {
      return moment(dateVal).fromNow();
    },
  
    likeToDiscuss(idea) {
      console.log("User "+this.$root.currentUser.email+", likes to discuss '"+idea.title+"'")
      RestClient.addSupporter(idea, this.$root.currentUser)
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
</style>

