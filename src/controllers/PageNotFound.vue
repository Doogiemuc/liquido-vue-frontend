<template>
  <div class="container">
    <h1>Liquido - (404) Page Not Found</h1>

    <div class="alert alert-danger">
      <p>The page <code>{{this.$route.fullPath}}</code> could not be found.</p>
      <br/>
      <ul>
        <li><router-link to="/">Go to back to Liquido start page</router-link></li>
        <li><a href="/">Reload Liquido web app completely</a></li>
      </ul>
    </div>
    
  </div>
</template>

<script>
export default {
  mounted() {
    console.log("Page not found: "+this.$route.fullPath)
  }
}
</script>

<style>

</style>
