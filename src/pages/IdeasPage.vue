<template>
<div class="container-fluid">
  <h1>Ideas</h1>
  <p class="lead">Spontaneous suggestions for improvement</p>
  <p>Here you can see all currently active ideas. If you want to support an idea, then click the button "Like to discuss this!" When an idea reaches at least NN supporters, then it is moved onto the table and can be voted upon.</p>


  <div class="filters">
    <form class="form-inline">
      <input type="text" class="form-control smallInput" id="filterSearch" placeholder="Search" />
        
      <div class="btn-group">
        <button type="button" class="btn btn-default btn-xs dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
          Updated: Anytime <span class="caret"></span>
        </button>
        <ul class="dropdown-menu">
          <li><a href="#">Today</a></li>
          <li><a href="#">Last 7 days</a></li>
          <li><a href="#">Last 14 days</a></li>
          <li role="separator" class="divider"></li>
          <li><a href="#">Anytime</a></li>
        </ul>
      </div>

      <div class="btn-group">
        <button type="button" class="btn btn-default btn-xs dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
          Area: Any <span class="caret"></span>
        </button>
        <ul class="dropdown-menu" style="padding: 5px 5px">
          <li><input type="checkbox"/> Area 1</a></li>
          <li><input type="checkbox"/> Area 2</li>
          <li><input type="checkbox"/> Area 3</li>
          <li role="separator" class="divider"></li>
          <li><button type="button" class="btn btn-primary btn-xs">Apply</button>&nbsp;<button type="button" class="btn btn-default btn-xs pull-right">Clear</button></li>
        </ul>
      </div>

      <div class="btn-group">
        <button type="button" class="btn btn-default btn-xs dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
          Created by: Anyone <span class="caret"></span>
        </button>
        <div class="dropdown-menu" style="padding: 5px 5px">
          <input type="text" class="form-control smallInput" id="filterUsr" placeholder="Find user" />
          <span class="glyphicon glyphicon-search form-control-feedback" aria-hidden="true"></span>
          <ul>
            <li>User 1</li>
            <li>User 2</li>
            <li>User 3</li>
          </ul>
        </div>  
      </div>

      <small><a href="#">Clear all filters</a></small>
    </form>
  </div>

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
    }
  },

  components: {
    DoogieTable
  },

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
    this.$refs.ideatable.localizedTexts.addButton = "Add Idea"

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

  
}
</script>

<style>
  .filters {
    margin-bottom: 10px;
  }

  .smallInput {
    height: 22px;
    padding: 6px 6px;
  }


</style>
