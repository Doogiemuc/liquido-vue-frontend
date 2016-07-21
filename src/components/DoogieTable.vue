/**
  Localizable boostrap table with sorting, filtering.  TODO: paging

  Usage:  
  <doogie-table
    :resource="vue-resource-rest-service"
    :columns="columnsArray"
    :primary-key-for-row="nameOrPathOfprimaryKeyAttribute">
  </doogie-table>

 */

<template>
  <link href="//cdnjs.cloudflare.com/ajax/libs/x-editable/1.5.0/bootstrap3-editable/css/bootstrap-editable.css" rel="stylesheet"/>
  <script src="//cdnjs.cloudflare.com/ajax/libs/x-editable/1.5.0/bootstrap3-editable/js/bootstrap-editable.min.js"></script>
  <!-- Doogies Data Table -->
  <table class="table table-condensed table-bordered doogie-table">
    <thead>
      <tr>
        <th v-if="showRowNumbers">&nbsp;</th>
        <th v-for="col in columns"
          @click="setSortCol(col)"
          :class="{active: sortByCol == col}">
          {{ col.title }}
          <span v-if="sortByCol == col" class="arrow"
            :class="sortOrder > 0 ? 'asc' : 'dsc'">
          </span>
        </th>
      </tr>
    </thead>
    <tbody>
      <tr v-if="loading">
        <td colspan="{{columns.length}}">Loading table data ...</td>
      </tr>
      <tr v-else="loading"
          v-for="row in rowData
                  | orderBy comparator sortOrder
                  | filterBy searchQuery
                  | paginationFilter">
        <th v-if="showRowNumbers">
          {{page*rowsPerPage + $index + 1}}
        </td>
        <td v-for="col in columns">
          <editable-cell v-if="col.editable"
            :row="row"
            :row-id="getPath(row, primaryKeyForRow)"
            :path="col.path"
            :value="getPath(row, col.path)" >
          </editable-cell>
          <span v-else="col.editable">
            {{ getPath(row, col.path) | localizeVal col.filter }}
          </span>
        </td>
      </tr>
    </tbody>
  </table>
  <div class="row">
    <div class="col-sm-2 text-left">
      <input name="query" v-model="searchQuery" placeholder="Search/Filter"/>
    </div>
    <!-- pager for doogie table -->
    <div class="col-sm-8 text-center">
      <nav v-if="lastPageIndex > 0">
        <ul class="pagination">
          <li v-if="page-adjacentPages >= 1">
            <a href="#" @click="page = 0">1</a>
          </li>
          <li class="disabled" v-if="page-adjacentPages > 1">
            <a href="#">...</a>
          </li>
          <li 
            v-for="pageIndex in currentPages" 
            v-if="pageIndex <= lastPageIndex"
            v-bind:class="isActivePage(pageIndex)?'active':''">
            <a href="#" @click="page = pageIndex">{{pageIndex+1}}</a>
          </li>
          <li class="disabled" v-if="page+adjacentPages < lastPageIndex-1">
            <a href="#">...</a>
          </li>
          <li v-if="page+adjacentPages < lastPageIndex">
            <a href="#" @click="page = lastPageIndex">{{lastPageIndex+1}}</a>
          </li>
        </ul>
      </nav>
    </div>
    <div class="col-sm-2 text-right">
      <button type="button" class="btn btn-default btn-sm">
        <i class="fa fa-plus-square" aria-hidden="true"></i> Add Idea
      </button>
    </div>
  </div>
  <div class="clearfix"></div>

</template>

<script>

import _ from 'lodash'
import Vue from 'vue'
import moment from 'moment'


export default {
  props: {
    //  Array of row data, eg. [ { title: "Col Title", path: "path.in.rest.response", filter: 'fromNow' }, { ... } ]
    columns: { type: Array, required: true },
    
    // vue-resource for fetching data. columns.path  must match the returned Object structure
    resource: { type: Object, required: true },
    
    // which path in resource data is the primary key for each row (rowID)
    primaryKeyForRow: { type: String, required: true },
  },

  data () {
    return {
      rowData: [],
      searchQuery: '',
      sortByCol: this.columns[0],      // by default sort by first col (thers must be a first col!)
      sortOrder: 1,
      page: 0,                    // currently shown page. 0 is first page!
      rowsPerPage: 5,             // how many rows per page shall be shown in the table?
      adjacentPages: 2,           // number of li elements to left and right (plus first/last page)
      showRowNumbers: true,       // show rowNumbers (of filtered result)
      loading: true,
    }
  },

  components: {
    'editable-cell' : require("./EditableCell")
  },

  computed: {
    // array of current page indexes that are shown in the pagination component
    currentPages() {
      var firstPageInPager = Math.max(0, this.page - this.adjacentPages)
      var result = new Array(this.adjacentPages*2 + 1)
      for (var i = result.length; i--; ) {
        result[i] = firstPageInPager + i
      }
      return result
    },
    // index of last page (after applying filter)
    lastPageIndex() {
      var filteredRowData = Vue.filter('filterBy')(this.rowData, this.searchQuery)
      return Math.max(0, Math.ceil(filteredRowData.length / this.rowsPerPage) - 1)
    }
  },
  
  methods: {
    // called when header is clicked. Reverses the sort order on each click
    setSortCol(col) {
      this.sortByCol = col
      this.sortOrder = this.sortOrder * -1
    },
    // compare two rows of data when sorting
    comparator(row1,row2) {
      if (!this.sortByCol) return 0;
      //console.log("getSortOrder sortByCol=", this.sortByCol.path, row1.title, row2.title)
      return _.get(row1, this.sortByCol.path) < _.get(row2, this.sortByCol.path) ? -1 : 1
             
    },
    // pick the Vue utility function 'getPath' and make it available in our template above
    getPath: Vue.parsers.path.getPath,
    // get length of filtered data (needed in pagination child component)
    getFilteredData() {
      return Vue.filter('filterBy')(this.rowData, this.searchQuery)
    }
  },
  
  filters: {
    paginationFilter(data) {
      return data.slice(this.page*this.rowsPerPage, this.page*this.rowsPerPage + this.rowsPerPage)
    },
    // cell values can be localized with these filters
    localizeVal(val, filterName) {
      if (!filterName) return val;
      var filterFunc = this.$options.filters[filterName] || Vue.options.filters[filterName];
      if (!_.isFunction(filterFunc)) return val;
      return filterFunc(val)
    },
    // returns a localized version of dateValue, e.g. 15.03.2016 for DE-DE
    localizeDate(dateVal) {
      return moment(dateVal).format('L'); 
    },
    // returns a localized string how far dataVal is in the past, e.g. "2 month ago"
    fromNow(dateVal) {
      return moment(dateVal).fromNow(); 
    },
  },
  
  events: {
    // This event is fired by editable-table when a cell's value has been edited.
    // The value in rowData has already been synced.
    // Here we update the value in the remote DB.
    'saveNewValue': function(rowId, key, value) {
      console.log("saveNewValue event in parent:", rowId, "#"+key+"#", value);
      var updateOp = { "$set" : {} }
      updateOp["$set"][key] = value
      this.resource.update({id: rowId}, updateOp)
      .then((response) => { 
        if (response.status == 200) { 
          console.log("New value saved successfully to DB: '"+value+"'")
        } else {
          console.error("Could not save new value: ", response)
        }
      })
    }
  },
  
  ready () {
    // Load rowData from restEndpoint
    this.loading = true
    var params = {}  //for example { q: "{ title: { $regex: 'idea', $options: 'i' }}" }  for a search query
    this.resource.get(params).then((response) => {
      console.log("Data from resource: ", response.json())
      this.rowData = response.json();
      this.loading = false
    }, (err) => {
      //TODO: show error message in table
      console.error(err)
    })
  }
  
}
</script>

<style>
th {
  background-color: #EEEEEE;
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

nav ul.pagination {
  padding: 0;
  margin: 0;
}
</style>
