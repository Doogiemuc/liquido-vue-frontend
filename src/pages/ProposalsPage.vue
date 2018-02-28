<template>
<div class="container-fluid">
  <h1>Proposals</h1>
  <p class="lead">Proposals for a law that can be discussed</p>
  <p>After an idea reached its quorum it becomes a proposal, is moved onto the table and can be discussed. You can vote for a proposal and add comments to it.</p>

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

export default {
  data () {
    return {
      // Data for DoogieTable.vue
      proposalColumns: [
        { title: "Title", path: "title", editable: false },
        { title: "Description", path: "description", editable: false },
        { title: "Created By", path: "createdBy" ,filter: 'userAvatar', rawHTML: true },
        { title: "Supporters", path: "numSupporters" },
        { title: "Category", path: "area.title" },
        { title: "Updated At", path: "updatedAt.$date", filter: 'fromNow' },
        { title: "Created At", path: "createdAt.$date", filter: 'localizeDate' },
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
      return '<img src="'+user.profile.picture+'" />&nbsp;' + user.profile.name
    },
    
    userProfileName(user) {     //TODO: use this when sorting in row "Created By"
    	return user.profile.name
    }
  },

  methods: {
    //MAYBE: addCommentToProposal() ...
  },

  mounted () {
    this.$root.ipl.findByStatus("PROPOSAL").then(proposals => {
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
