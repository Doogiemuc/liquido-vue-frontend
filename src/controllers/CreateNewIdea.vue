<template src="../views/createNewIdea.html"></template>

<script>
var ideaService = require('../services/IdeaService.js')
var TinyMceComponent = require('../components/TinyMceComponent.vue')

export default {
  data () {
    return {
      idea: {
        title: "",
        description: ""
      },
      createNewIdeaForm: {}  // will be set by VueForm
    }
  },

  components: {
    'tinymce' : TinyMceComponent
  },

  methods: {
    /* @return bootstrap class 'invisible' when input field is valid, so that no error message is shown */
    toggleErrorMsg(formElem) {
      return formElem.$touched && formElem.$invalid ? '' : 'invisible'
    },

    /* @return true when form is pristine (newly loaded) or invalid, so that submit button is disabled  */
    isSubmitDisabled(form) {
      return form.$invalid || form.$pristine
    },

    /** set button to loading state and save idea to DB */
    saveIdea() {
      $('#saveIdeaButton').button('loading')
      var that = this
      this.idea.createdBy = this.$root.currentUser._id
      console.log("Saving idea: this.idea=", this.idea, this.$router);

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

    }
  },

  events: {
    /** fires when the content of tinymce editor changed. */
    'update-content' : function(newContent) {
      this.idea.description = newContent
      this.createNewIdeaForm.ideaDescription.$touched = true
    }
  },

}
</script>


<style>
  .form-error-msg {
    font-size: 80%;
    color: #a94442;
    margin-left: 10px;
  }
  input.vf-touched.vf-invalid {
    border-color: #a94442;
    box-shadow: inset 0 1px 1px rgba(0,0,0,.075);
  }
</style>
