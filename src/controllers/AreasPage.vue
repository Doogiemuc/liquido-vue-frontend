<template>
<div class="container-fluid">
  <h1>Liquido - Areas</h1>
  <p class="lead">Categories for ideas and laws</p>
  <p>An area may be an "area of interest" or a category or a department, depending on your context.</p>

  <doogie-table
    :row-data="areas"
    :columns="areaColumns"
    :primary-key-for-row="areaKey"
    :show-add-button="true"
    :rows-per-page="10"
    v-on:saveNewValue="saveNewValue"
    v-on:addButtonClicked="addButtonClicked"
    ref="areatable"
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
      areaColumns: [
        { title: "Title", path: "title", editable: true },
        { title: "Description", path: "description", editable: true  },
        { title: "Created By", path: "creator" ,filter: 'userAvatar', rawHTML: true },   // areas have a creator
        { title: "Updated At", path: "updatedAt.$date", filter: 'fromNow' },
        { title: "Created At", path: "createdAt.$date", filter: 'localizeDate' },
      ],
      areaKey: "_links.self.href",
      /*
      ideaTexts: {                //TODO: localize
        addButton: "Add Idea",
        searchFilter: "Search/Filter"
      },
      */ 
      areas: []
    }
  },

  components: {
    DoogieTable
  },

  filters: {
    userAvatar(user) {
      return '<img src="'+user.profile.picture+'" />&nbsp;' + user.profile.name
    }
  },

  methods: {
    // the full areaURI is the rowId in DoogieTable!
    saveNewValue(updatedArea, areaURI, key, value) {
      //console.log("saveNewValue event in AreasPage.vue:", areaURI, "#"+key+"#", value);
      var patchedArea = {} 
      patchedArea[key] = value    // only send the updated key, e.g. { title: "new title" } in a PATCH request
      this.$root.api.patch(areaURI, patchedArea)
    },
    'addButtonClicked': function() {
      console.log('addButtonClicked in Ideas.vue')
      this.$router.push('/createNewArea')
    },
  },

  mounted() {
    this.$refs.areatable.localizedTexts.addButton = "Add Area"
    
    //load remote data
    this.$refs.areatable.message = "Loading ..."
    this.$root.api.fetchAllAreas().then(areas => {
      this.areas = areas
      this.$refs.areatable.message = ''
    })
    .catch(function(err) {
      console.log("ERROR loading areas: ", err)
      this.$refs.areatable.message = "Error loading areas!"
    })
    
  },

}
</script>

<style>

</style>
