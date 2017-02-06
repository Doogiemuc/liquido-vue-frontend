<template src="../views/editIdea.html"></template>

<script>
/**
 Edit an existing idea or create a new one

 */
import TinyMceComponent from '../components/TinyMceComponent.vue'
import { validationMixin } from 'vuelidate'                         // https://monterail.github.io/vuelidate/
import { required, minLength } from 'vuelidate/lib/validators'

export default {
  mixins: [validationMixin],

  props: {
    createNewIdea: {
      type: Boolean,
      default: function() { return true }
    },
    pageTitle: {
      type: String,
      default: function() { return "Create new idea" }
    }
  },

  data () {
    return {
      idea: { title: "", description: ""  }
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

  components: {
    'tinymce' : TinyMceComponent
  },

  mounted() {
    //console.log("mounted this.$v=", JSON.stringify(this.$v))
  },

  methods: {
    /* @return bootstrap class 'invisible' when input field is valid, so that no error message is shown */
    toggleErrorMsg(formElem) {
      return ''
      //return formElem.$touched && formElem.$invalid ? '' : 'invisible'
    },

    /* @return true when form is pristine (newly loaded) or invalid, so that submit button is disabled  */
    isSubmitDisabled() {
      return true
      //return form.$invalid || form.$pristine
    },

    titleTouched() {
      //console.log("Title touched: "+JSON.stringify(this.$v.idea.title))
      this.$v.idea.title.$touch()
    },

    /** called when the content of tinymce editor changed. */
    descriptionTouched(newDescription) {
      //console.log("descriptionTouched: "+this.idea.description)
      this.idea.description = newDescription
      this.$v.idea.description.$touch()
    },

    /** set button to loading state and save idea to DB */
    saveIdea() {
      $('#saveIdeaButton').button('loading')
      var that = this
      this.idea.createdBy = this.$root.currentUser._id
      console.log("Saving idea: this.idea=", JSON.stringify(this.idea));
      /*
      ideaService.insertNewItem(this.idea)
      .then(() => {
        $('#saveIdeaButton').button('reset')
        swal({
          title: "SUCCESS",
          text: "Your new Idea has been saved successfully.<br/>You know need at least NN supporters that like to discuss your idea.",
          type: "success"
        },
        function () {
          that.$router.push('/userHome')
        })
      }).catch(err => {
        console.error(err)
        $('#saveIdeaButton').button('reset')   // so that the user can try to save again
      })
      */

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
</style>
