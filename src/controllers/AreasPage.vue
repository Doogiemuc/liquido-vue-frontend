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
    :rows-per-page="5"
    :adjacent-pages="2"
    v-on:addRow="addRow"
    ref="areatable"
  >
  </doogie-table>
</div>
</template>

<script>
import DoogieTable from '../components/DoogieTable'
import apiClient from '../services/LiquidoApiClient'

export default {
  data () {
    return {
      // Data for DoogieTable.vue
      areaColumns: [
        { title: "Title", path: "title", editable: true },
        { title: "Description", path: "description", editable: true  },
        { title: "Created By", path: "creator", filter: 'userAvatar', rawHTML: true },
        { title: "Updated At", path: "updatedAt.$date", filter: 'fromNow' },
        { title: "Created At", path: "createdAt.$date", filter: 'localizeDate' },
        //TODO:  number of supporters
      ],
      areaKey: "title",
      /*
      ideaTexts: {                //TODO: localize
        addButton: "Add Idea",
        searchFilter: "Search/Filter"
      },
      */ 
      areas: [],
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
    // called when a value was changed
    saveNewValue(rowId, key, value) {
      console.log("saveNewValue event in parent:", rowId, "#"+key+"#", value);
    },
    addRow() {
      console.log('addButtonClicked in AreaPage.vue')
      //this.$router.push('/createNewArea')
    },
  },

  created() {
    //load remote data and replace users
    apiClient.fetchAllAreas().then(areas => {
      this.areas = areas
      this.$refs.areatable.message = ""
    })
    .catch(function(err) {
      console.log("ERROR loading areas: ", err)
      //show error to user, e.g. in ideatable
      this.$refs.areatable.message = "Error loading areas"
    })
    
  },

  mounted() {
    this.$refs.areatable.message = "Loading ..."
    this.$refs.areatable.localizedTexts.addButton = "Add Area"
  }


}
</script>

<style>

</style>
