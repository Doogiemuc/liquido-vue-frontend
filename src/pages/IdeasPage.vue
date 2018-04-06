<template>
<div class="container-fluid">
  <h1>Ideas</h1>
  <p class="lead">Spontaneous suggestions for improvement</p>
  <p>Here you can see all currently active ideas. If you want to support an idea, then click the button "Like to discuss this!" When an idea reaches at least NN supporters, then it is moved onto the table and can be voted upon.</p>

  <doogie-filter
    :filtersConfig="filtersConfig"
    ref="ideatableFilter"
  />

  <doogie-table
    :row-data="ideas"
    :columns="ideaColumns"
    :primary-key-for-row="ideaKey"
    :loading="ideasLoading"
    :show-add-button="true"
    v-on:saveNewValue="saveNewValue"
    v-on:addButtonClicked="addButtonClicked"
    ref="ideatable"
  />

</div>

</template>

<script>
import DoogieTable from '../components/DoogieTable'
import DoogieFilter from '../components/DoogieFilter'
import moment from 'moment'

/** compare user names of createdBy */
var createdByComparator = function(val1, val2) {
  return val1.createdBy.profile.name.localeCompare(val2.createdBy.profile.name, 'lookup', { numeric: true } );
}

export default {
  data () {
    return {
      // Data for DoogieTable.vue
      ideaColumns: [
        { title: "Title", path: "title", editable: true },
        { title: "Description", path: "description", editable: false },
        { htmlTitle: '<i class="fa fa-user"></i>', path: "createdBy", filter: 'userAvatar', rawHTML: true, comparator: createdByComparator },
        { htmlTitle: '<i class="fa fa-thumbs-o-up"></i>', path: "numSupporters" },
        { htmlTitle: '<i class="fa fa-bookmark"></i>', path: "area.title", filter: 'makeSmall', rawHTML: true },
        { title: "Created", path: "createdAt", filter: 'localizeDateSmall', rawHTML: true },
        { title: "Last activity", path: "updatedAt", filter: 'fromNowSmall', rawHTML: true },
      ],
      ideaKey: "_links.self.href",
      ideasLoading: true,
      ideas: [],
      showAddButton: false,
      filtersConfig: [
        {
          type: "search",
          id: "s",
          displayName: "Free text search"
        },
        {
          type: "dateRange",
          id: "updatedAt",
          displayName: "Updated"
        },
        {
          type: "select",
          id: "selectID",
          displayName: "Select Example",
          options: [
            { value: 1, displayValue: "Eins" },
            { value: 2, displayValue: "Zwei" },
            { value: 3, displayValue: "Drei" }
          ]
        },
        {
          type: "selectWithSearch",
          id: "selectWithSearchID",
          displayName: "Long Select Example",
					//valueChangedHandler: function() { ...},
          options: [
            { value: 1, displayValue: "Hans" },
            { value: 2, displayValue: "Peter" },
            { value: 3, displayValue: "Paul" },
            { value: 3, displayValue: "Susi" },
            { value: 3, displayValue: "Petra" },
            { value: 3, displayValue: "Johanna" },
            { value: 3, displayValue: "Iris" },
            { value: 1, displayValue: "Hans" },
            { value: 2, displayValue: "Peter" },
            { value: 3, displayValue: "Paul" },
            { value: 3, displayValue: "Susi" },
            { value: 3, displayValue: "Petra" },
            { value: 3, displayValue: "Johanna" },
            { value: 3, displayValue: "Iris" },
            { value: 1, displayValue: "Hans" },
            { value: 2, displayValue: "Peter" },
            { value: 3, displayValue: "Paul" },
            { value: 3, displayValue: "Susi" },
            { value: 3, displayValue: "Petra" },
            { value: 3, displayValue: "Johanna" },
            { value: 3, displayValue: "Iris" },
            { value: 1, displayValue: "Hans" },
            { value: 2, displayValue: "Peter" },
            { value: 3, displayValue: "Paul" },
            { value: 3, displayValue: "Susi" },
            { value: 3, displayValue: "Petra" },
            { value: 3, displayValue: "Johanna" },
            { value: 3, displayValue: "Iris" },
            { value: 1, displayValue: "Hans" },
            { value: 2, displayValue: "Peter" },
            { value: 3, displayValue: "Paul" },
            { value: 3, displayValue: "Susi" },
            { value: 3, displayValue: "Petra" },
            { value: 3, displayValue: "Johanna" },
            { value: 3, displayValue: "Iris" },
          ]
        },

        {
          type: "multi",
          id: "multiSelectID",
          displayName: "Multi Select",
          options: [
            { value: 'A', displayValue: "AAA" },
            { value: 'B', displayValue: "BBB" },
            { value: 'C', displayValue: "CCC" }
          ],
        },
				{
          type: "multi",
          id: "multiSelectID2",
          displayName: "Multi Select 2",
          options: [
            { value: 'A', displayValue: "AAA" },
            { value: 'B', displayValue: "BBB" },
            { value: 'C', displayValue: "CCC" }
          ],
        },

      ]
    }
  },

  components: {
    DoogieTable,
    DoogieFilter
  },

  methods: {
    /**
     * save an updated value of an Idea
     * This is called when the EditableCell component fires the "saveNewValue" event
     * @param ideaURI the full ideaURI which shall be updated (which is the rowId in IdeaTable!)
     * @param path
     */
    saveNewValue(ideaURI, column, value) {
      console.log("saveNewValue event in IdeasPage.vue:", ideaURI, column, value);
      var patchedIdea = {} 
      patchedIdea[column.path] = value    // only send the updated key, e.g. { title: "new title" } in a PATCH request
      this.$root.api.patch(ideaURI, patchedIdea)
    },

    addButtonClicked() {
      console.log('addButtonClicked in Ideas.vue')
      this.$router.push('/editIdea')
    },
  },

  mounted () {
    //this.$refs.ideatable.localizedTexts.addButton = "Add Idea"   No add button in table

    //var oneWeekAgo = "2018-01-01"
    this.$root.api.getRecentIdeas().then(ideas => {
      this.ideas = ideas
      this.ideasLoading = false
    })
    .catch(err  => {
      console.log("ERROR loading Ideas: ", err)
      //TODO: show error to user, e.g. in ideatable
    })
  },

  /** These are vue "filters". The convert the passed value into a format that shows to the user. (They should be called converters by vue.) */
  filters: {
    userAvatar(user) {
      return '<img src="'+user.profile.picture+'" />' // + user.profile.name
    },

    supportButton(numSupporters) {
      return '<button  type="button" class="btn btn-default btn-xs active"><span data-v-0fe3ecbc="" aria-hidden="true" class="fa fa-thumbs-o-up"></span></button>'
    },
    
    makeSmall(str) {
      return '<small>'+str+'</small>'
    },

    localizeDateSmall(dateVal) {
      return '<small>'+moment(dateVal).format('L')+'</small>'
    },

    fromNowSmall(dateVal) {
      return '<small>'+moment(dateVal).fromNow()+'</small>'
    }
  },
  
}
</script>

<style>

</style>
