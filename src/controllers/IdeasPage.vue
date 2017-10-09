<template>
<div class="container-fluid">
  <h1>Liquido - Ideas</h1>
  <p class="lead">Spontaneous suggestions for improvement</p>
  <p>Here you can see all currently active ideas. If you want to support an idea, then click the button "Like to discuss this!" When an idea reaches at least NN supporters, hen it is moved onto the table and can be voted upon.</p>

  <doogie-table
    :row-data="ideas"
    :columns="ideaColumns"
    :primary-key-for-row="ideaKey"
    :loading="ideasLoading"
    :show-add-button="true"
    v-on:saveNewValue="saveNewValue"
    v-on:addButtonClicked="addButtonClicked"
    ref="ideatable"
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
      ideaColumns: [
        { title: "Title", path: "title", editable: true },
        { title: "Description", path: "description", editable: true  },
        { title: "Created By", path: "createdBy" ,filter: 'userAvatar', rawHTML: true },
        { title: "Supporters", path: "numSupporters" },
        { title: "Category", path: "area.title" },
        { title: "Updated At", path: "updatedAt.$date", filter: 'fromNow' },
        { title: "Created At", path: "createdAt.$date", filter: 'localizeDate' },
      ],
      ideaKey: "_links.self.href",
      ideasLoading: true,
      ideas: [],
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
    // the full ideaURI is the rowId in DoogieTable!
    saveNewValue(updatedIdea, ideaURI, key, value) {
      //console.log("saveNewValue event in IdeasPage.vue:", ideaURI, "#"+key+"#", value);
      var patchedIdea = {} 
      patchedIdea[key] = value    // only send the updated key, e.g. { title: "new title" } in a PATCH request
      this.$root.api.patch(ideaURI, patchedIdea)
    },
    'addButtonClicked': function() {
      console.log('addButtonClicked in Ideas.vue')
      this.$router.push('/editIdea')
    },
  },

  mounted () {
    this.$refs.ideatable.localizedTexts.addButton = "Add Idea"

    //load remote data and replace users
    this.$root.api.fetchAllIdeas().then(ideas => {
      this.ideas = ideas
      this.ideasLoading = false
    })
    .catch(function(err) {
      console.log("ERROR loading Ideas: ", err)
      //TODO: show error to user, e.g. in ideatable
    })
  },

  
}
</script>

<style>

</style>
