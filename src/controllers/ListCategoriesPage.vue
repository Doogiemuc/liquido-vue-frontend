<template>
<div class="container-fluid">
  <h1>Liquido - Categories</h1>
  <p class="lead">Categories for ideas and proposals</p>
  <p>A category could be an "area of interest", a political department or just simply a tag, depending on your context.
     A voter may delegate his vote to one proxy in each category.</p>

  <doogie-table
    :row-data="categories"
    :columns="categoryColumns"
    :primary-key-for-row="categoryKey"
    :show-add-button="true"
    :rows-per-page="10"
    v-on:saveNewValue="saveNewValue"
    v-on:addButtonClicked="addButtonClicked"
    ref="categorytable"
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
      categoryColumns: [
        { title: "Title", path: "title", editable: true },
        { title: "Description", path: "description", editable: true  },
        { title: "Created By", path: "creator" ,filter: 'userAvatar', rawHTML: true },   // categories have a creator
        { title: "Updated At", path: "updatedAt.$date", filter: 'fromNow' },
        { title: "Created At", path: "createdAt.$date", filter: 'localizeDate' },
      ],
      categoryKey: "_links.self.href",
      /*
      ideaTexts: {                //TODO: localize
        addButton: "Add Idea",
        searchFilter: "Search/Filter"
      },
      */ 
      categories: []
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
    // the full categoryURI is the rowId in DoogieTable!
    saveNewValue(updatedCategory, categoryURI, key, value) {
      //console.log("saveNewValue event in ListCategoriesPage.vue:", categoryURI, "#"+key+"#", value);
      var patchedCategory = {} 
      patchedCategory[key] = value    // only send the updated key, e.g. { title: "new title" } in a PATCH request
      this.$root.api.patch(categoryURI, patchedCategory)
    },
    'addButtonClicked': function() {
      console.log('addButtonClicked in Ideas.vue')
      this.$router.push('/createNewCategory')
    },
  },

  mounted() {
    this.$refs.categorytable.localizedTexts.addButton = "Add Category"
    
    //load remote data
    this.$refs.categorytable.message = "Loading ..."
    this.$root.api.fetchAllCategories().then(categories => {
      this.categories = categories
      this.$refs.categorytable.message = ''
    })
    .catch(function(err) {
      console.log("ERROR loading categories: ", err)
      this.$refs.categorytable.message = "Error loading categories!"
    })
    
  },

}
</script>

<style>

</style>
