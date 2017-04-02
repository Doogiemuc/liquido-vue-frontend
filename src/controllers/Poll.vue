<template>
  <div class="container">
    <div class="page-heading">
      <h2>Cast your vote</h2>
      <p>
        Drag the proposals you want to vote for from the left into the ballot on the right. 
        Sort your favorite proposals to the top of your ballot.
      </p>
      <p>
        This poll will run for {{pollOpenDays}} more days until {{pollOpenUntilDateLoc}}.
      </p>
    </div>
    <table class="table pollTable">
      <tbody>
        <tr>
          <th width="49%" class="tableTitle">
            Proposals in this poll
          </th>
          <th width="2%"></th>
          <th width="49%" class="tableTitle">
            Your sorted ballot
          </th>
        </tr>
        <tr>
          <td width="49%" id="leftContainer">
          
            <law-panel v-for="proposal in proposals" 
              :law="proposal" 
              :showTimeline="false"
              :showGotoPoll="false">  
            </law-panel>
        
          </td>
          <td width="2%" class="middleColumn">
            <i class="fa fa-angle-double-right fa-4x" aria-hidden="true"></i>
          </td>
          <td width="49%" id="rightContainer">
            <div class="rightWrapper">
              <div v-if="ballotIsEmpty" class="rightDropHere">
                Drop proposals here!
              </div>
            </div>
          </td>
        </tr>
      </tbody>
    </table>

    <button type="button" class="btn btn-primary pull-right" v-bind:disabled="this.ballotIsEmpty" @click="castVote()">Cast vote</button>
    
  </div>
</template>

<script>
import LawPanel from '../components/LawPanel'
import moment from 'moment'
import dragula from 'dragula'
// import bootbox from 'bootbox'

export default {
  components: { LawPanel },

  data () {
    return {
      poll: {},
      proposals: [],
      ballotIsEmpty: true
    }
  },
  
  mounted () {
    var pollURI = this.$route.query.poll
    if (pollURI == undefined) {
      console.error("Poll.vue: Missing URL parameter for poll!")
    }
    this.loadPoll(pollURI).then(() => {
      this.$nextTick(() => {
        var drake = dragula([document.getElementById('leftContainer'), document.getElementById('rightContainer')]);
        //console.log(drake, document.getElementById('test'))
        drake.on('drop', this.ballotDropped)
      })
    })
  },

  methods: {
    getFromNow: function(dateVal) {
      return moment(dateVal).fromNow();
    },

    loadPoll: function(pollURI) {
      return this.$root.api.fetchPoll(pollURI).then(poll => {
        this.poll = poll
        this.proposals = poll._embedded.proposals
      })
    },

    ballotDropped: function(el, target, source, sibbling) {
      //console.log("dropped onto target=", target, $('#rightContainer div.panel').length)
      this.ballotIsEmpty = $('#rightContainer div.panel').length == 0
    },

    castVote: function(evt) {
      //var password = prompt("Please enter your Liquido password to anonymize your vote.") 
      var pollURI = this.poll._links.self.href   
      var voteOrder = []
      $('#rightContainer div.panel').each((idx, panel) => {
        //console.log(panel.dataset.proposaluri)
        voteOrder.push(panel.dataset.proposaluri)
      })

      var newBallot = {
        "poll": pollURI,
        "voteOrder": voteOrder
      }

      console.log("castVote", newBallot)
      this.$root.api.postBallot(newBallot)
        .then(res =>  { 
        	console.log("Ballot posted successfully")
        	swal({
        		title: "Ballot saved successfully",
        		text:  "Your vote has been cast and your ballot was saved.\n\n"+
        		       "You can still change the sorting insinde your ballot as long as the poll is running.",
        		type:  "success"
        	})
        })
        .catch(err => { console.error("Cannot postBallot: "+err) })
    }
  }
  
}
</script>

<style scoped>
  .pollTable td, .pollTable th {
    border: none;
  }
  .tableTitle {
    text-align: center;
    font-size: 20px;
  }
  .middleColumn {
    text-align: center;
    padding-top: 100px;
  }
  .panel-heading h4 {
    margin-top: 0;
    margin-bottom: 0;
  }
  .userPictureLeft {
    float: left;
    margin-right: 8px;
  }

  #leftContainer {
    min-height: 200px;
    background: #DDD;
  }

  #leftContainer div.panel,
  #rightContainer div.panel {
    cursor: move;
    cursor: grab;
    cursor: -moz-grab;
    cursor: -webkit-grab;
    transition: opacity 0.4s ease-in-out;
  }

  .gu-mirror {
    cursor: grabbing;
    cursor: -moz-grabbing;
    cursor: -webkit-grabbing;
  }

  #rightContainer {
    border: 1px solid #DDD;
    background-color: rgba(255,255,232, 0.5);
  }

  .rightWrapper {
    position: relative;
    /*border: 1px solid green; */
  }

  .rightDropHere {
    z-index: -1;      /* in the background */
    width: 100%;
    position: absolute;
    text-align: center;
    color: #DDD;
    font-size: 2em;
    margin-top: 70px;
    padding-top: 20px;
    padding-bottom: 20px;
    border: 4px dashed #DDD;
    border-radius: 8px;
  }


  


</style>
