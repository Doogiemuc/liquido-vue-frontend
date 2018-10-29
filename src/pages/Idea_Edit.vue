<template>
<div class="container">
  <h1>{{pageTitle}}</h1>
  <div class="panel panel-default">
    <div class="panel-body">

      <div name="editIdeaForm" class="form">
        <div class="form-group" v-bind:class="{ 'form-group--error': $v.idea.title.$error }">
          <input class="form-control" name="ideaTitle" id="ideaTitle" placeholder="Title of your idea"
           v-model.trim="idea.title"
           @blur="titleTouched" />
          <p class="form-error-msg" v-bind:class="{'invisible' : !$v.idea.title.$error}">Please provide a title (at least 5 chars)</p>
        </div>
        <div class="form-group">
          <span name="ideaDescription">
            <tinymce
              name="ideaDescription"
              textarea-id="ideaDescriptionEditor"
              placeholder="Describe what your idea will improve ..."
              v-model="idea.description"
              ref="ideaDescriptionEditor"
              v-on:input="descriptionTouched">
            </tinymce>
          </span>
          <p class="form-error-msg" v-bind:class="{'invisible' : !$v.idea.description.$error}">Please provide a longer description.</p>
        </div>

        <div class="form-group">
          <label for="ideaCategory" class="col-sm-1 control-label">Category</label>
          <div class="col-sm-5">
            <select v-model="idea.area" name="ideaArea" class="form-control">
              <option v-for="category in categories" v-bind:value="category._links.self.href">{{category.title}}</option>
            </select>
          </div>
          <div class="col-sm-6">
            <button id="saveIdeaButton" @click.prevent="saveIdea" class="pull-right btn btn-primary"
             data-loading-text="<i class='fa fa-spinner fa-spin '></i> Saving Idea ..."
             v-bind:disabled="$v.idea.$invalid">Save Idea</button>
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


export default {
  mixins: [validationMixin],

  components: {
    'alert-panel' : AlertPanel,
    'tinymce' : TinyMceComponent
  },

  props: ['ideaId'],   // can be passed as URL path parameter  e.g.  /editIdea/4711

  data () {
    return {
      pageTitle: "Create new idea",
      categories: [],
      idea: { title: "", area: undefined, description: "" },
    }
  },

  validations: {
    idea: {
      title: {
        required, minLength: minLength(5)
      },
      description: {
        required, minLength: minLength(20)
      },
      area: {
        required
      }
    }
  },

  watch: {
    'idea.description' : function(newDec) {
      // console.log("EditIdea: idea.description has changed to", newDec)
    }
  },


  mounted() {
    this.$root.api.getAllCategories().then(categories => { this.categories = categories })

    if (!isNaN(this.ideaId)) {  // if ideaId was passed as a number, then edit that existing idea
      console.log("Edit idea id="+this.ideaId)
      this.pageTitle = "Edit idea"
      this.$root.api.getIdea(this.ideaId).then(idea => {
        this.idea = idea
      })
    }
  },

  methods: {
    titleTouched() {
      //console.log("Title touched: "+JSON.stringify(this.$v.idea.title))
      this.$v.idea.title.$touch()
      console.log(this.$root)
    },

    /** called when the content of tinymce editor changed. */
    descriptionTouched(newDescription) {
      //console.log("EditIdea.descriptionTouched: "+this.idea.description)
      this.$v.idea.description.$touch()
    },

    /** set button to loading state and save idea to DB */
    saveIdea() {
      $('#saveIdeaButton').button('loading')
      var that = this
      console.log("Saving idea", JSON.stringify(this.idea));
      this.$root.api.saveNewIdea(this.idea)
      .then(saveIdea => {
        $('#saveIdeaButton').button('reset')
        var minSupporters = this.$root.props['liquido.supporters.for.proposal']
        swal({
          title: "SUCCESS",
          text: "Your new idea has been saved successfully. You now need at least "+minSupporters+" supporters that like to discuss your idea.",
          type: "success"
        },
        function () {
          that.$router.push('/userHome')
        })
      }).catch(err => {
        console.error(err)
        var errorMessage = "Could not save your new idea. You may try again later."
        var errorDetails = JSON.stringify(err)
        this.$refs.alertPanel.showAlert(errorMessage, errorDetails)
        $('#saveIdeaButton').button('reset')   // so that the user can try to save again
      })
    },

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
