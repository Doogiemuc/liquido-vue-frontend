<template>
  <form id="search">
    <span class="pull-right">Filter <input name="query" v-model="searchQuery" /></span>
  </form>
  <table class="table table-condensed table-bordered">
    <thead>
      <tr>
        <th v-for="col in columns"
          @click="sortBy(col)"
          :class="{active: sortKey == col.name}">
          {{col.name }}
          <span v-if="sortKey == col.name" class="arrow"
            :class="sortOrders[col.name] > 0 ? 'asc' : 'dsc'">
          </span>
        </th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="row in rowData
        | filterBy searchQuery
        | orderBy sortKey sortOrders[sortKey]">
        <td v-for="col in columns">{{ row[col.name] }}</td>
      </tr>
    </tbody>
  </table>

</template>

<script>

import _ from 'lodash'

export default {
  props: {
    resource: Object,       // vue-resource for fetching data
    columns: Array,        // [ { name: "Col Title", path: "path.in.rest.response"}, { ... } ]
  },

  data () {
    var sortOrders = {}
    this.columns.forEach((col) => {
      sortOrders[col.name] = 1
    })
    return {
      searchQuery: '',
      sortKey: '',
      sortOrders: sortOrders,
      rowData: []
    }
  },
  
  methods: {
    sortBy (col) {
      this.sortKey = col.name
      this.sortOrders[col.name] = this.sortOrders[col.name] * -1
    } 
  },
  
  ready () {
    // Load rowData from restEndpoint
    var params = {}  // { q: "{ title: { $regex: 'idea', $options: 'i' }}" }
    this.resource.get(params).then((response) => {
      //console.log(response.json())
      //map the received jsonArray into rowData as given by the path in columns.key
      response.json().forEach((jsonRow) => {
        var row = {}
        this.columns.forEach((col) => {
          row[col.name] = _.get(jsonRow, col.path)   // key is row.name
        }) 
        this.rowData.push(row)
      })
      console.log(this.rowData)
    }, (err) => {
      console.error(err)
    })
  }
  
  
}
</script>

<style>
th {
  background-color: #EEE;
  color: rgba(0,0,0,0.66);
  cursor: pointer;
  -webkit-user-select: none;
  -moz-user-select: none;
  -user-select: none;
}


th.active .arrow {
  opacity: 1;
}

.arrow {
  display: inline-block;
  vertical-align: middle;
  width: 0;
  height: 0;
  margin-left: 5px;
  opacity: 0.66;
}

.arrow.asc {
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-bottom: 4px solid #000;
}

.arrow.dsc {
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-top: 4px solid #000;
}
</style>
