<template>
	<div class="panel panel-default">

    <div v-if="lawListTitle" class="panel-heading">
      <h4 class="lawListTitle">{{lawListTitle}}</h4>
    </div>
    <table class="table lawListCondensedTable">
      <tbody>
        <tr v-for="law in laws" :key="law.id" :data-lawuri="getLawURI(law)">
          <td>
            <div class="maxHeightPreviewWrapper">
              <h4 class="lawTitle">
                <router-link v-if="!readOnly" :to="getLinkToLaw(law)">
                  <i :class="getIconFor(law)" aria-hidden="true"></i>&nbsp;{{law.title}}
                </router-link>
              </h4>
              <div class="maxHeightPreview" :style="previewHeightStyle" v-html="law.description"></div>
            </div>
          </td>
          <td class="greyDataRight">
            <img :src="law.createdBy.profile.picture" class="userPicture">
            <support-button :law="law" class="likeButton" v-on:like="likeToDiscuss" :readOnly="readOnly || law.createdByCurrentUser"></support-button>
            <ul class="fa-ul">
              <li><span class="fa-li"><i class="far fa-user"></i></span>{{law.createdBy.profile.name}}</li>
              <li><span class="fa-li"><i class="far fa-clock"></i></span>{{getFromNow(law.createdAt)}}</li>
              <li><span class="fa-li"><i class="far fa-bookmark"></i></span>{{law.area.title}}</li>
			  <li><span class="fa-li"><i :class="getIconFor(law)" aria-hidden="true"></i></span>{{law.status}}</li>
              <li v-if="law.poll !== null"><span class="fa-li"><i class="fas fa-poll"></i></span>
                <router-link :to="'/polls/'+law.poll.id">Poll</router-link>
              </li>
            </ul>

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
import SupportButton from '../components/SupportButton'

export default {
  props: {
    'laws' :         { type: Array,   required: true },
    'previewHeight': { type: String,  required: false, default: function() { return "75px" }},
    'readOnly' :     { type: Boolean, required: false, default: function() { return false }},
    'lawListTitle' : { type: String,  required: false, default: function() { return "" }}
  },

  components: {
    'support-button': SupportButton
  },

  computed: {
    previewHeightStyle: function() { return "height: "+this.previewHeight },

  },

  methods: {
	getLawURI(law) {
      return this.$root.api.getURI(law)
	},
	
    // dynamically set icon depending on law.status
    getIconFor(law) {
      switch(law.status) {
		case "IDEA":
			return { "far": true, "fa-lightbulb": true }
		case "PROPOSAL": 
			return { "far": true, "fa-file-alt": true }
		case "ELABORATION":
			return { "far": true, "fa-comments": true }
		case "VOTING":
			return { "fas": true, "fa-vote-yea": true }
        case "LAW":
			return { "fas": true, "fa-balance-scale-left": true }
		case "DROPPED":
			return { "far": true, "fa-window-close": true }
		case "RETENTION":
			return { "fas": true, "fa-temperature-low": true }
		case "RETRACTED":
			return { "fas": true, "fa-backspace": true }
        default:
			return { "fas": true, "fa-university": true }
      }
    },

    likeToDiscuss(law) {
      console.log("User "+this.$root.currentUser.email+", likes to discuss '"+law.title+"'")
      this.$root.api.addSupporterToIdea(law, this.$root.currentUser).then(res => {
        //BUGFIX:  cannot simply update this.law, becasue Vue properties should not be updated. So we fire an event to parent instead:
        this.$emit("reloadLaw", law)  // notify parent to reload this law
      })
    },

    getFromNow: function(dateVal) {
      return moment(dateVal).fromNow();
    },

    /** get the link for the title of the idea, proposal or law */
    getLinkToLaw(law) {
      //TODO: Should I manage these frontend URL in a central place? MAYBE in confg/dev.env.js
      switch(law.status) {
        case 'IDEA':     return '/ideas/'+law.id
        case 'LAW':      return '/laws/'+law.id
        default:         return '/proposals/'+law.id   // PROPOSAL, ELABORATION
      }
    },
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
  .userPicture {
    margin-bottom: 5pt;
  }
  .likeButton {
    float: right;
  }
  .greyDataRight {
    width: 120px;
    color: grey;
    font-size: 12px;
    background-color: rgb(245,245,245);
  }
  .greyDataRight ul.fa-ul {
    margin-left: 1.5em;
    margin-bottom: 0;
  }
  .maxHeightPreviewWrapper {
    position: relative;
  }
  .maxHeightPreviewWrapper h4 {
    margin-top: 0;
    margin-bottom: 5px;
  }
  .maxHeightPreview {
    overflow:hidden;
    line-height: 1.2em;
  }
  .maxHeightPreview:before {
    content:'';
    width:100%;
    height:10px;
    position:absolute;
    left:0;
    bottom:0;
    /* Permalink - use to edit and share this gradient: http://colorzilla.com/gradient-editor/#ffffff+0,ffffff+100&0+0,1+100 */
    background: -moz-linear-gradient(top, rgba(255,255,255,0) 0%, rgba(255,255,255,1) 100%); /* FF3.6-15 */
    background: -webkit-linear-gradient(top, rgba(255,255,255,0) 0%,rgba(255,255,255,1) 100%); /* Chrome10-25,Safari5.1-6 */
    background: linear-gradient(to bottom, rgba(255,255,255,0) 0%,rgba(255,255,255,1) 100%); /* W3C, IE10+, FF16+, Chrome26+, Opera12+, Safari7+ */
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
