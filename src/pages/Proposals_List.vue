<template>
<div class="container-fluid">
  <h1>Proposals</h1>
  <p class="lead">Proposals for a law that can be discussed.</p>
  <p>After an idea reaches its quorum it becomes a proposal. It is moved onto the table and can be discussed. You can vote for a proposal and add comments to it.</p>

  <doogie-table
    :row-data="proposals"
    :columns="proposalColumns"
    :primary-key-for-row="proposalKey"
    :loading="proposalsLoading"
    :show-add-button="false"
    ref="proposaltable"
  >
  </doogie-table>

</div>

</template>

<script>
import DoogieTable from '../components/DoogieTable'

/** compare user names of createdBy */
var createdByComparator = function(val1, val2) {
  return val1.createdBy.profile.name.localeCompare(val2.createdBy.profile.name, 'lookup', { numeric: true } );
}

export default {
  data () {
    return {
      // Data for DoogieTable.vue
      proposalColumns: [
        { title: "Title", path: "title", editable: false },   //TODO: make poll title a link to Proposal_Show.vue
        //TODO: if (proposal.poll !=== null) showLinkToPoll()
        { title: "Description", path: "description", editable: false },
        { htmlTitle: '<i class="fa fa-user"></i>', path: "createdBy", filter: 'userAvatar', rawHTML: true, comparator: createdByComparator },
        { htmlTitle: '<i class="fa fa-thumbs-o-up"></i>', path: "numSupporters" },
        { htmlTitle: '<i class="fa fa-bookmark"></i>', path: "area.title" },
        { title: "Created", path: "createdAt.$date", filter: 'localizeDate' },
        { title: "Last activity", path: "updatedAt.$date", filter: 'fromNow' },
      ],
      proposalKey: "_links.self.href",
      proposalsLoading: true,
      proposals: [],
    }
  },

  components: {
    DoogieTable
  },

  filters: {
    userAvatar(user) {
      return '<img src="'+user.profile.picture+'" />' 
    },
    
    userProfileName(user) {     //TODO: use this when sorting in row "Created By"
    	return user.profile.name
    }
  },

  methods: {
    //MAYBE: addCommentToProposal() ...
   
  },

  mounted () {
    this.$root.api.findByStatus("PROPOSAL").then(proposals => {
      this.proposals = proposals
      this.proposalsLoading = false
    })
    .catch(err  => {
      console.log("ERROR loading Proposals: ", err)
      //TODO: show error to user, e.g. in ideatable
    })
  },

  
}
</script>

<style>

</style>
