
<template>
  <textarea :id="textareaId" v-bind:placeholder="initialValue"></textarea>
</template>

<script>

export default {

  props: {
    textareaId:    { type: String, required: true },                        // id of the textarea == id of tinymce.Editor (without leading '#'!)
    initialValue:  { type: String, required: false, default: "" },          // Initial content of tinymce editor.
    tinyMceConfig: { type: Object, required: false, default: function() {   // TinyMCE default configuration, can be overwritten from parent component
      return {
        menubar: false,
        plugins: [
          'advlist autolink lists link image charmap print preview anchor',
          'searchreplace visualblocks code fullscreen',
          'insertdatetime media table contextmenu paste -placeholder'
        ],
        toolbar: 'undo redo | insert | styleselect | bold italic underline | alignleft aligncenter alignright | bullist numlist outdent indent | link image charmap',
        statusbar: false
      }
    }}
  },

  methods: {
    /* returns the current content of the tinymce editor */
    getContent() {
      return tinymce.get(this.textareaId).getContent()
    },

    /* completely overwrite and set a new content into the tinymce editor */
    setContent(newContent) {
      tinymce.get(this.textareaId).setContent(newContent)
    },

    /** 
     * Automatically called when the content of the editor has change in any way 
     * Content may have changed either by keypress, unde/redo or via copy&paste.
     */
    contentUpdated(evt) {
      //console.log("TinyMCE contentUpdated to "+this.getContent()+" and sending event.")
      this.$emit('contentUpdated', this.getContent());
    }
  },

  mounted () {
    console.log("TinyMceComponent.mounted() id="+this.textareaId+" initialValue="+this.initialValue)
    this.tinyMceConfig.selector = '#' + this.textareaId
    tinymce.init(this.tinyMceConfig)
    .then(editors => {
      //console.log("Loading tinymce plugin placeholder") // Need to dynamically load this plugin from local, not from tinymce CDN.
      tinymce.PluginManager.load('placeholder', '/static/js/tinymce/plugins/tinymce-placeholder.plugin.js');

      //console.log("TinyMceComponent.tinymce init finished.  NumEditors=", editors.length)
      // No need to handle any updates between textarea and tinymce's content. tinymce already keeps the text areas content in sync with its content.
      tinymce.get(this.textareaId)
      .on('keyup',  this.contentUpdated)
      .on('change', this.contentUpdated)
      .on('undo',   this.contentUpdated)
      .on('redo',   this.contentUpdated)
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
    // https://github.com/fergaldoyle/vue-form/blob/master/example/custom-component.html   Form validation with TinyMCE

    //tinymce.baseURL = '//cdn.tinymce.com/4'
    //tinymce.suffix  = '.min'

    //tinyMCE.init({mode: "none"})
    //tinyMCE.execCommand('mceAddEditor', true, 'ideaDescription');

</script>

<style>
</style>