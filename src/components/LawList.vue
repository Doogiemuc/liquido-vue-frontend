<template>
	<div class="panel panel-default">
    
    <div v-if="lawListTitle" class="panel-heading">
      <h4 class="lawListTitle">{{title}}</h4>
    </div>
    <table class="table lawListCondensedTable">
      <tbody>
        <tr v-for="law in laws">
          <td width="80%">
            <img src="/static/img/Avatar_32x32.jpeg" class="userPictureLeft">
            <h4 class="lawTitle">{{law.title}}</h4>
            <div class="maxHeightPreviewWrapper">
            <div class="maxHeightPreview">{{law.description}}</div>
            </div>
          </td>
          <td class="greyDataRight">
            <ul class="fa-ul">
            <li><i class="fa-li fa fa-user"></i>{{law.createdBy.profile.name}}</li>
            <li><i class="fa-li fa fa-clock-o"></i>{{getFromNow(law.createdAt)}}</li>
            <li><i class="fa-li fa fa-bookmark"></i>{{law.area.title}}</li>
            <li v-if="law.numCompetingProposals > 0"><i class="fa-li fa fa-balance-scale"></i>{{law.numCompetingProposals}} alternatives</li>
            </ul>
            <i class="pull-left fa lawIcon grey" v-bind:class="getIconFor(law)" aria-hidden="true"></i>
            <button v-if="law.supportedByCurrentUser" type="button" class="btn btn-default btn-xs active">
              <span class="fa fa-thumbs-o-up" aria-hidden="true"></span> {{law.numSupporters}}
            </button>
            <button v-else type="button" class="btn btn-default btn-xs" v-on:click="likeToDiscuss(law)">
              <span class="fa fa-thumbs-o-up" aria-hidden="true"></span> {{law.numSupporters}}
            </button>
          </td>
        </tr>
      </tbody>
    </table>

  </div>
</template>

<script>
/*
  Condensed list of ideas, proposals or laws.
 */
import moment from 'moment'

export default {
  props: { 
    'laws' : { type: Array, required: true },
    'lawListTitle' : { type: String, required: false, default: function() { return "" }}
  },
  
  methods: {
    // dynamically set icon depending on law.status
    getIconFor: function(law) {
      return {
        "fa-lightbulb-o": law.status == "IDEA",
        "fa-file-text-o": law.status == "PROPOSAL",
        "fa-university":  law.status == "LAW"
      }
    },
    
    likeToDiscuss(law) {
      console.log("User "+this.$root.currentUser.email+", likes to discuss '"+law.title+"'")
      this.$root.api.addSupporter(law, this.$root.currentUser).then(res => {
        //BUGFIX:  cannot simply update this.law, becasue Vue properties should not be updated. So we fire an event to parent instead:
        this.$emit("reloadLaw", law)  // notify parent to reload this law
      })
    },
    
    getFromNow: function(dateVal) {
      return moment(dateVal).fromNow();
    },

    getLawURI() {
      return this.$root.api.getURI(this.law)
    }
  }
}
</script>

<style scoped>
  .lawIcon {
  	font-size: 20px;
  }
  .lawListTitle {
    margin-top: 0;
    margin-bottom: 0;
  }
  .userPictureLeft {
    float: left;
    margin-right: 8px;
  }
  .greyDataRight {
    padding-top: 18px;
    color: grey;
    font-size: 12px;
    background-color: rgb(245,245,245);
  }
  .greyDataRight ul.fa-ul {
    margin-left: 1.5em;
  }
  .greyDataRight .userPicture {
    margin-bottom: 8px;
  }
  .maxHeightPreviewWrapper {
    position: relative;
  }
  .maxHeightPreview {
    height:55px; 
    overflow:hidden;  
  }
  .maxHeightPreview:before {
    content:'';
    width:100%;
    height:100%;    
    position:absolute;
    left:0;
    top:0;
    /* Permalink - use to edit and share this gradient: http://colorzilla.com/gradient-editor/#ffffff+0,ffffff+90,ffffff+100&0+0,0+90,1+100 */  
    background: -moz-linear-gradient(top, rgba(255,255,255,0) 0%, rgba(255,255,255,0) 90%, rgba(255,255,255,1) 100%); /* FF3.6-15 */
    background: -webkit-linear-gradient(top, rgba(255,255,255,0) 0%,rgba(255,255,255,0) 90%,rgba(255,255,255,1) 100%); /* Chrome10-25,Safari5.1-6 */
    background: linear-gradient(to bottom, rgba(255,255,255,0) 0%,rgba(255,255,255,0) 90%,rgba(255,255,255,1) 100%); /* W3C, IE10+, FF16+, Chrome26+, Opera12+, Safari7+ */
    filter: progid:DXImageTransform.Microsoft.gradient( startColorstr='#00ffffff', endColorstr='#ffffff',GradientType=0 ); /* IE6-9 */
  }
  .item-condensed {
    padding-top: 3px;
    padding-bottom: 3px;
  }
  .item-condensed i {
    line-height: inherit;  /* necessary to vertically align fontawesome icons */
  }
  .item-condensed p {
    margin-bottom: 0;
  }
</style>
