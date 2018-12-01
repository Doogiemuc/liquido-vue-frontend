<template>
  <div class="container">
    Logout
  </div>
</template>

<script>

import apiClient from '../services/LiquidoApiClient'

export default {
  mounted() {
    this.$root.logout()
  }

}
</script>

<style>

</style>
