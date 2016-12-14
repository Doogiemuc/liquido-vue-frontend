
<template>
  <textarea :id="textareaId">{{{content}}}</textarea>
</template>

<script>

export default {

  props: {
    textareaId:    { type: String, required: true },                        // id of the textarea == id of tinymce.Editor (without leading '#'!)
    content:       { type: String, required: false, default: "" },          // Initial content of tinymce editor. (Not meant to be used with  content.sync="...")
    tinyMceConfig: { type: Object, required: false, default: function() {   // TinyMCE default configuration, can be overwritten from parent component
      return {
        menubar: false,
        plugins: [
          'advlist autolink lists link image charmap print preview anchor',
          'searchreplace visualblocks code fullscreen',
          'insertdatetime media table contextmenu paste'
        ],
        toolbar: 'undo redo | insert | styleselect | bold italic underline | alignleft aligncenter alignright | bullist numlist outdent indent | link image charmap',
      }
    }}
  },

  methods: {
    getContent() {
      return tinymce.get(this.textareaId).getContent()
    },
    setContent(newContent) {
      tinymce.get(this.textareaId).setContent(newContent)
    }
  },

  ready () {
    console.log("TinyMceComponent.ready() id="+this.textareaId)

    var textAreaRef = this
    var updateContent = function(evt) {
      //console.log("Updating content to "+this.getContent())
      textAreaRef.content = this.getContent()   // this is the tinymce.Editor !!!
    }

    this.tinyMceConfig.selector = '#' + this.textareaId

    tinymce.init(this.tinyMceConfig)
    .then(editors => {
      //console.log("TinyMceComponent.tinymce init finished.  NumEditors=", editors.length)
      // No need to handle any updates between textarea and tinymce's content. tinymce already keeps the text areas content in sync with its content. But need to update this.content property
      tinymce.get(this.textareaId)
      .on('keyup',  updateContent)
      .on('change', updateContent)
      .on('undo',   updateContent)
      .on('redo',   updateContent)
    })
  },

  beforeDestroy () {
    console.log("TinyMceComponent.beforeDestory(): Removing editor")
    tinymce.remove('#'+this.textareaId)   // This is important! Otherwise the editor wouldn't get reinitialized when comming back
    //console.log("editor.length="+tinymce.EditorManager.editors.length)
  }


}


    //Some refs I found while implementing this
    // http://stackoverflow.com/questions/17688549/jquery-load-tinymce-4-on-demand
    // http://stackoverflow.com/questions/34059166/vuejs-tinymce-tinymce-is-only-displayed-once
    // https://jsfiddle.net/edwindeveloper90/edjc82z0/
    // http://codegists.com/snippet/vue/tinymce-directivevue_lossendae_vue
    // JSFiddle with TinymCE and Vue-Router   http://jsfiddle.net/NF2jz/5246/
    // https://github.com/lpreterite/vue-tinymce/blob/master/src/vue-tinymce.js     Full componente  (asian)

    //tinymce.baseURL = '//cdn.tinymce.com/4'
    //tinymce.suffix  = '.min'

    //tinyMCE.init({mode: "none"})
    //tinyMCE.execCommand('mceAddEditor', true, 'ideaDescription');

</script>

<style>
</style>