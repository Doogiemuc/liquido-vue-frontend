<template>
	<div class="modal fade" tabindex="-1" role="dialog">
    <div class="modal-dialog" role="document">
      <div class="modal-content">
        <div class="modal-header">
          <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
          <h4 class="modal-title">Join this poll</h4>
        </div>
        <div class="modal-body">
          <p>Which of your proposals do you want to join into this poll?</p>
          <input name="Search" placeholder="Search" />
        </div>
        <table class="table">
          <thead> 
            <tr><th>Title</th><th>Description</th></tr> 
          </thead> 
          <tbody> 
            <tr v-for="proposal in userProposals"><th scope="row">{{proposal.title}}</th><td>{{proposal.description}}</td></tr>
          </tbody> 
        </table>
        <div class="modal-footer">
          <button type="button" class="btn btn-default" data-dismiss="modal">Cancel</button>
          <button type="button" class="btn btn-primary">Join Poll</button>
        </div>
      </div><!-- /.modal-content -->
    </div><!-- /.modal-dialog -->
  </div><!-- /.modal -->
</template>

<script>
/*
  Modal Popup that is shown over the poll page, when a user wants to join a poll
 */
import moment from 'moment'

export default {
  props: { 
    'poll' : { type: Object, required: true },
  },

  data() {
    return {
      userProposals: []
    }
  },

  methods: {
    getFromNow: function(dateVal) {
      return moment(dateVal).fromNow();
    },
    
    joinPoll() {
    }
  },

  created() {
    // fetch proposals of this user that are not yet part of another poll
    this.$root.api.findByStatusAndCreator('PROPOSAL', this.$root.currentUser).then(proposals => { 
      this.userProposals = proposals.filter(proposal => {
        return proposal.poll === null || proposal.poll === undefined
      })
    })    
  }
}
</script>

<style scoped>
 
</style>
