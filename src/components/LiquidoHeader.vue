<template src="../views/partials/header.html"></template>

<script>
export default {
  data () {
    return { 
      user: {
        email: "test@doogie.de",
        password: "as23ö5ldfkgg",
        profile: {
          name: "Test User",
          avatar: "https://gravatar.com/avatar/a9fe2e688ec8dd3c68f90e3438da7b3d?s=60&d=retro"
        }

      }   
    }
  }
}
</script>

<style>
  .navbar-nav img {
    width: 30px;
    height: 30px;
    margin:  -15px 15px -15px;
  }
</style>
