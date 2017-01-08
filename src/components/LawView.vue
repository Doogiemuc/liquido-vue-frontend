<template>
	<div class="panel panel-default">
      <div class="panel-body">
        <div class="media">
          <div class="media-left"><img src="/static/img/Avatar_32x32.jpeg" class="media-object"></div>
          <div class="media-body">
            <div class="news_heading">
              <i class="pull-right fa fa-university-o lawIcon" aria-hidden="true"></i>
              {{law.createdBy.profile.name}} <br>{{getFromNow(law.createdAt)}} | <span class="glyphicon glyphicon-inbox" aria-hidden="true"></span> {{law.area.title}}
            </div>
          </div>
        </div>
        <div>
          <h3>{{law.title}}</h3>
          <p>== TIMELINE ==</p>
          {{law.description}}
        </div>
      </div>
      <div style="text-align: right;" class="panel-footer"><a href="undefined" role="button" class="btn btn-default btn-xs">Show Details &raquo;</a></div>
    </div>
</template>

<script>
var moment = require('moment');

export default {
	props: ['law'],

	methods: {
    getFromNow: function(dateVal) {
      return moment(dateVal).fromNow();
    }
  }
}
</script>

<style scoped>
  .lawIcon {
  	font-size: 30px;
  }
</style>
