<template src="../views/editIdea.html"></template>

<script>
/**
 * Edit an existing idea or create a new one
 */
import TinyMceComponent from '../components/TinyMceComponent.vue'
import { validationMixin } from 'vuelidate'                         // https://monterail.github.io/vuelidate/
import { required, minLength } from 'vuelidate/lib/validators'

export default {
  mixins: [validationMixin],

  props: ['ideaId'],   // can be passed as URL path parameter  e.g.  /editIdea/4711

  data () {
    return {
      pageTitle: "Create new idea",
      categories: [],
      idea: { title: "", area: {}, description: "", area: undefined }
    }
  },

  validations: {
    idea: {
      title: {
        required, minLength: minLength(5)
      },
      description: {
        required, minLength: minLength(20)
      }
    }
  },

  watch: {
    'idea.description' : function(newDec) {
      // console.log("EditIdea: idea.description has changed to", newDec)
    }
  },

  components: {
    'tinymce' : TinyMceComponent
  },

  mounted() {
    this.$root.api.fetchAllCategories().then(categories => { this.categories = categories })

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
      //this.idea.createdBy = this.$root.currentUserID
      this.idea.area = ""  // force an ERROR   FIXME
      console.log("Saving idea: this.idea=", JSON.stringify(this.idea));
      this.$root.api.saveIdea(this.idea)
      .then(() => {
        $('#saveIdeaButton').button('reset')
        swal({
          title: "SUCCESS",
          text: "Your new Idea has been saved successfully. You know need at least NN supporters that like to discuss your idea.",
          type: "success"
        },
        function () {
          that.$router.push('/userHome')
        })
      }).catch(err => {
        console.error(err)
        $('#saveIdeaButton').button('reset')   // so that the user can try to save again
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
</style>
