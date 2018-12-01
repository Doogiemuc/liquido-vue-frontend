<template>
  <div class="alert alert-dismissible fade" role="alert">
    <button type="button" class="close" aria-label="Close" ><span @click="closeAlert" aria-hidden="true">&times;</span></button>
    <h4>{{title}}</h4>
    <p>{{message}}</p>
    <div id="detailsWrapper" class="collapse">
      <textarea id="detailsMessage">{{detailMessage}}</textarea>
    </div>
    <div class="expandButton pull-right" @click="toggleCollapse">
      <i class="fas fa-caret-down"></i>
    </div>
    <div style="text-align: right">
      <button type="button" class="btn btn-default btn-sm" @click="copyDetailsToClipboard">Copy error details to clipboard</button>
      <button type="button" class="btn btn-primary btn-sm" @click="closeAlert">Close</button>
    </div>
  </div>
</template>

<script>
/**
 * Simple alert, e.g. for error messages
 * The alert div also contains a (initially hidden) textarea that can hold a detailed message.
 * This detailed message can be copied to the clipboard with just one click.
 * You can use this for example for technical stacktraces.
 */
export default {
  props: {
		title: { type: String, required: true },
    // caller MUST set class attribute on component: alert-success, alert-info, alert-warning, alert-danger
	},

	data() {
		return {
			message: "",
			detailMessage: "",
		}
	},

  methods: {
    showAlert(message, detailMessage) {
    	this.message = message
    	this.detailMessage = detailMessage
    	$("div.alert").addClass('in')
    },

    closeAlert() {
      //console.log("closing alert")
      $("div.alert").removeClass('in')
    },

    toggleCollapse(evt) {
      $('#detailsWrapper').collapse('toggle')
      $(evt.currentTarget)
        .find('[data-fa-i2svg]')
        .toggleClass('fa-caret-up')
        .toggleClass('fa-caret-down');

    },

    copyDetailsToClipboard() {
      var copyText = document.getElementById("detailsMessage");
      copyText.select();
      document.execCommand("copy");
    }
  },

}
</script>

<style scoped>
  .alert .expandButton {
    position: relative;
    right: -19px;
    top: 23px;
  }
  #detailsMessage {
    width: 100%;
    height: 400px;
    font-size: 10px;
    font-family: monospace;
    overflow: scroll;
  }
  .alert > p {
    margin-bottom: 10px;
  }

</style>

