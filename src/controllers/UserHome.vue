<template src="../views/userHome.html"></template>

<script>
export default {
  data () {
    return {
      restEndpoint: 'http://localhost/rest/laws',
      user: {
        email: "dummy@doogie.de",
        profile: {
          name: "Robert Static"
        }
      },
      ideas: [],     //TODO: make a sorted list of panels out of that
      laws: []
    }
  },
  
  ready () {
    this.loadLaws();
  },
  
  methods: { 
    loadLaws() {
      console.log("Loading laws");  
      this.$http.get(this.restEndpoint).then((response) => {
        console.log(response)
      }, (response) => {
        console.log("ERROR: ", response)
      });

    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style>
  .news_heading {
    color: #999;
    font-size: 12px;
  }
</style>
