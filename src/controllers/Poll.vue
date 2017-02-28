<template>
  <div class="container">
    <div class="page-heading">
      <h2>Cast your vote</h2>
      <p>
        Drag the proposals you want to vote for from the left into the ballot on the right. 
        Sort your favorite proposals to the top of your ballot.
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
          
            <law-panel v-for="law in competingProposals" 
              :law="law" 
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

export default {
  components: { LawPanel },

  data () {
    return {
      competingProposals: [],
      proposalsInBallot: [],
      ballotIsEmpty: true
    }
  },
  
  mounted () {
    var proposalURI = this.$route.query.proposal
    if (proposalURI == undefined) {
      console.error("Poll.vue: Missing URL parametere proposal!")
    }
    this.loadCompetingProposals(proposalURI).then(() => {
      this.$nextTick(() => {
        var drake = dragula([document.getElementById('leftContainer'), document.getElementById('rightContainer')]);
        console.log(drake, document.getElementById('test'))
        drake.on('drop', this.ballotDropped)
      })
    })
  },

  methods: {
    getFromNow: function(dateVal) {
      return moment(dateVal).fromNow();
    },
    loadCompetingProposals: function(proposalURI) {
      return this.$root.api.fetchCompetingProposals(proposalURI).then(proposals => {
        this.competingProposals = proposals
      })
      //TODO: show only one overall timeline for this poll
      //TODO: show smaller lawPanels (eg. all proposals are in the same area)
      //TODO: should I show number of votes?  => NO!
    },
    ballotDropped: function(el, target, source, sibbling) {
      console.log("dropped onto target=", target, $('#rightContainer div.panel').length)
      this.ballotIsEmpty = $('#rightContainer div.panel').length == 0
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
