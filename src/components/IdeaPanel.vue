<template>
	<div class="panel panel-default">
      <div class="panel-body">
        <div class="media">
          <div class="media-left"><img src="/static/img/Avatar_32x32.jpeg" class="media-object"></div>
          <div class="media-body">
            <div class="news_heading">
              <i class="pull-right fa fa-lightbulb-o ideaIcon grey" aria-hidden="true"></i>
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
        supported={{idea.supportedByCurrentUser?"true":"false"}}
        <span v-bind:class="{ 'green' : idea.supportedByCurrentUser }" >
          <span class="fa fa-thumbs-o-up" aria-hidden="true"></span> {{idea.numSupporters}}
          &nbsp;
        </span>
        <a v-if="!idea.supportedByCurrentUser" v-on:click.prevent="likeToDiscuss(idea)" href="#" role="button" class="btn btn-default btn-xs">Like to discuss this!</a>
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
      RestClient.addSupporter(idea, this.$root.currentUser).then(result => {
        //completely reload idea.  This will also solve the side case, when user is already a supporter
        var ideaId = RestClient.uri2Id(idea._links.self.href)
        // about projections: http://stackoverflow.com/questions/15886897/how-do-i-avoid-n1-queries-with-spring-data-rest
        RestClient.ideasCollection.get(ideaId, { 'projection': 'ideaProjection' }, ).then(response => {    
          this.idea = response.body().data()
          //console.log(JSON.stringify(this.idea, " ", 2))
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
</style>

