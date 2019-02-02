<template>
<div class="container">
  <h1>{{pageTitle}}</h1>
  <div class="panel panel-default">
    <div class="panel-body">

      <div name="editIdeaForm" class="form">
        <div class="form-group" v-bind:class="{ 'form-group--error': $v.title.$error }">
          <input class="form-control" name="ideaTitle" id="ideaTitle" placeholder="Title of your idea"
           v-model.trim="title"
           @blur="titleTouched" />
          <p class="form-error-msg" v-bind:class="{'invisible' : !$v.title.$error}">Please provide a title (at least 5 chars)</p>
        </div>
        <div class="form-group">
          <span name="ideaDescription">
            <tinymce
              name="ideaDescription"
              textarea-id="ideaDescriptionEditor"
              placeholder="Describe what your idea will improve ..."
              v-model="description"
              ref="ideaDescriptionEditor"
              v-on:input="descriptionTouched">
            </tinymce>
          </span>
          <p class="form-error-msg" v-bind:class="{'invisible' : !$v.description.$error}">Please provide a longer description.</p>
        </div>

        <div class="form-group">
          <label for="ideaCategory" class="col-sm-1 control-label">Category</label>
          <div class="col-sm-5">
            <select v-model="areaURI" name="ideaArea" class="form-control">
              <option v-for="category in categories" v-bind:value="category._links.self.href">{{category.title}}</option>
            </select>
          </div>
          <div class="col-sm-6">
            <button id="saveIdeaButton" @click.prevent="clickSaveButton" class="pull-right btn btn-primary"
             data-loading-text="<i class='fa fa-spinner fa-spin '></i> Saving Idea ..."
             v-bind:disabled="$v.$invalid">Save</button>
          </div>
        </div>
      </div>

    </div>
  </div>

  <alert-panel
    ref="alertPanel"
    title="Error"
    class="alert-danger errorAlert">
  </alert-panel>

</div>
</template>

<script>
/**
 * Edit an existing idea or create a new one
 */
import TinyMceComponent from '../components/TinyMceComponent.vue'
import AlertPanel from '../components/AlertPanel.vue'
import { validationMixin } from 'vuelidate'                         // https://monterail.github.io/vuelidate/
import { required, minLength } from 'vuelidate/lib/validators'
import loglevel from 'loglevel'
var log = loglevel.getLogger('Idea_Edit.js')

export default {
  mixins: [validationMixin],

  components: {
    'alert-panel' : AlertPanel,
    'tinymce' : TinyMceComponent
  },

  props: ['ideaId'],   // URL path parameter  e.g.  /editIdea/4711

  data () {
    return {
      pageTitle: "Create new idea",
      categories: [],
      idea: undefined, // Existing idea will be loaded when an ideaId is passed as path parameter. Otherwise user can create a new idea here.

      // editable idea attributes in the form
      title: "",
      description: "",
      areaURI: undefined,
    }
  },

  validations: {
    title: {
      required, minLength: minLength(5)
    },
    description: {
      required, minLength: minLength(20)
    },
    areaURI: {
      required
    }

  },

  /*
  watch: {
    'title': function(newTitle) {
      console.log("EdidtIdea: title changed to "+newTitle)
    },
    'description' : function(newDec) {
      console.log("EditIdea: description has changed to", newDec)
    },
    'areaURI': function(newAreaURI) {
      console.log("AreaURI has been set to "+newAreaURI)
    }
  },
  */


  mounted() {
    this.$root.api.getAllCategories().then(categories => { this.categories = categories })

    if (!isNaN(this.ideaId)) {  // if ideaId was passed as a number, then edit that existing idea
      log.debug("Edit idea id="+this.ideaId)
      this.pageTitle = "Edit idea"
      this.$root.api.getIdea(this.ideaId).then(loadedIdea => {
        this.idea  = loadedIdea
        this.title = loadedIdea.title
        this.description = loadedIdea.description
        this.$root.api.follow(loadedIdea, "area").then(area => {
          var selfLink = this.$root.api.getHateoasLink(area, "self")
          this.areaURI = selfLink
        })
      })
      .catch(err => {
        if (err.response.status == 404) {
          log.warn("Cannot find idea.id="+this.ideaId)
          this.$refs.alertPanel.showAlert("Cannot find idea id="+this.ideaId, err)
        }
      })
    }

  },

  methods: {
    /** when input field for title has been blurred. We only check onBlur, so that any error is only shown after leaving the field. */
    titleTouched() {
      //console.log("Title touched: "+JSON.stringify(this.$v.ideaForm.title))
      this.$v.title.$touch()
    },

    /** called when the content of tinymce editor was changed by user input. */
    descriptionTouched(newDescription) {
      //console.log("EditIdea.descriptionTouched: "+this.description)
      this.$v.description.$touch()  // needed to make $v.$dirty == true
    },

    /** set button to loading state and save idea to DB */
    clickSaveButton() {
      $('#saveIdeaButton').button('loading')
      this.$refs.alertPanel.clearAlert()
      if (isNaN(this.ideaId)) {
        this.saveNewIdea()
      } else {
        this.updateIdea()
      }
    },

    /** Save a newly created idea. Will show a large SWAL on success and then forward to userHome */
    saveNewIdea() {
      var that = this
      var newIdea = {
        title: this.title,
        description: this.description,
        area: this.areaURI
      }
      log.info("Saving new idea", newIdea);
      this.$root.api.saveNewIdea(newIdea)
        .then(saveIdea => {
          $('#saveIdeaButton').button('reset')
          var minSupporters = this.$root.props['liquido.supporters.for.proposal']
          swal({
            title: "SUCCESS",
            text: "Your idea has been created successfully. You now need at least "+minSupporters+" supporters that like to discuss your idea.",
            type: "success"
          },
          function () {
            that.$router.push('/userHome')
          })
        })
        .catch(err => {
          console.error(err)
          var errorMessage = "Could not save your new idea. You may try again later."
          var errorDetails = err
          this.$refs.alertPanel.showAlert(errorMessage, errorDetails)
          $('#saveIdeaButton').button('reset')   // so that the user can try to save again
        })
    },

    /** Update an existing idea via HTTP PATCH */
    updateIdea() {
      var updatedIdea = {
        title: this.title,
        description: this.description,
        area: this.areaURI
      }
      var ideaUri = this.$root.api.getURI(this.idea)
      log.info("Update existing idea "+this.ideaUri)
      this.$root.api.patchIdea(ideaUri, updatedIdea)
        .then(res => {
          $('#saveIdeaButton').button('reset')
          log.debug("updated idea ", res)
          iziToast.success({
            title: 'Success',
            message: "Idea successfully updated."
          })
        })
        .catch(err => {
          $('#saveIdeaButton').button('reset')
          log.error("Cannot update idea", err)
          iziToast.error({
            title: 'Error',
            message: "Cannot update idea.<br/>Please try again later.",
          })
        })

    }
  }
}
</script>


<style>
  .form-error-msg {
    font-size: 90%;
    color: #a94442;
    margin-left: 10px;
  }
  .form-group--error input {
    border-color: #a94442;
  }
  .control-label {
    padding-top: 7px;
    margin-bottom: 0;
    text-align: right;
  }
  .errorAlert {
    width: 60%;
    margin-left: auto;
    margin-right: auto;
  }
</style>
