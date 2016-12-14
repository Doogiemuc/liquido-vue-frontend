/**
 * Vue Directive that can be added to a textarea to add TinyMCE WYSIWYG editor.
 *
 * https://jsfiddle.net/edwindeveloper90/edjc82z0/
 * http://codegists.com/snippet/vue/tinymce-directivevue_lossendae_vue
 *
 */

<script>
import Vue from 'vue'

module.exports = {

    twoWay: true,

    bind: function() {
      var self = this;
      var IDattr = self.el.getAttribute('id')  // value of id="" attribute WITHOUT '#' prefix!

      console.log("TinyMCEDirective.bind  IDattr="+IDattr)

      console.log("========== JQUERY val=", $('#ideaDescription').val())

      Vue.nextTick(function() {
            console.log("========== TinyMCEDirective.nextTick el.val=", $('#ideaDescription').val())
            console.log("self.el.id=", self.el.id)
            tinymce.init({
              selector: '#'+IDattr,
              setup: function(editor) {
                console.log("tinymce.setup editor="+editor)

                editor.on('init', function() {
                  console.log("TinyMCEDirective.editor.on(init) setContent to="+self.el.innerHTML)
                  this.setContent(self.el.innerHTML);   // 'this' is the editor
                });

                // when typing keyup event
                editor.on('keyup', function() {
                  console.log("TinyMCEDirective.editor.on  KEYUP this=", this)
                  // get new value
                	var new_value = this.getContent(self.value);   // 'this' is the editor
                  // set model value
                  self.set(new_value)
                });
              }

            })
            .then(function(editors) {
              console.log("TinyMCEDirective.init.then() editors=", editors)
            })
            .catch(err => {
              console.err("TinyMCEDirective ERROR: ", err)
            });


      })
    },

    update: function(newVal, oldVal) {
      console.log("tinymce update newVal="+newVal)
      // set val and trigger event
      $(this.el).val(newVal).trigger('keyup');
    },

    unbind: function() {
      console.log("tinymce unbind")
      tinymce.remove('#' + this.el.getAttribute('id'))
    }

}
</script>