/**
  Localizable boostrap table with sorting, filtering and paging.
  You can pass in data directly as an array of rows or pass a vue-resource.

  Features:
    - RowData can be local or loaded from remote REST resource
    - The data of each row can be an object
    - Cell values can be converted from the source object before shown in a cell
    - Sortable by each column
    - Optional Row numbers
    - Search/Filter input (client side filtering!)
    - localisatzion support

  Usage:
  <doogie-table
    :resource="vue-resource-rest-service"
    :columns="columnsArray"
    :primary-key-for-row="nameOrPathOfprimaryKeyAttribute"
    :localized-texts="yourTranslations"
  >
  </doogie-table>

 */

<template>
  <div id="DoogieTableWrapper">
    <link href="//cdnjs.cloudflare.com/ajax/libs/x-editable/1.5.0/bootstrap3-editable/css/bootstrap-editable.css" rel="stylesheet"/>
    <script src="//cdnjs.cloudflare.com/ajax/libs/x-editable/1.5.0/bootstrap3-editable/js/bootstrap-editable.min.js"></script>
    <div v-if="positionOfSearch=='top'" id="searchDiv">
      <input name="query" v-model="searchQuery" placeholder="{{localizedTexts.searchFilter}}"/>
    </div>
    <table class="table table-condensed table-bordered table-hover doogie-table">
      <thead>
        <tr>
          <th v-if="showRowNumbers">&nbsp;</th>
          <th v-for="col in columns"
            @click="clickHeader(col)"
            :class="{active: sortByCol == col}">
            {{ col.title }}
            <span v-if="sortByCol == col" class="arrow"
              :class="sortOrder > 0 ? 'asc' : 'dsc'">
            </span>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="!loading && (rowData == undefined || rowData.length == 0)">
          <td colspan="{{columns.length + (showRowNumbers ? 1 : 0)}}">{{localizedTexts.emptyData}}</td>
        </tr>
        <tr v-if="loading">
          <td colspan="{{columns.length + (showRowNumbers ? 1 : 0)}}">{{localizedTexts.loadingText}} {{resourceError}}</td>
        </tr>
        <tr v-else="loading" @click="rowClicked(row)"
            v-for="row in rowData
                    | orderBy comparator sortOrder
                    | filterBy searchQuery
                    | paginationFilter">
          <th v-if="showRowNumbers">
            {{page*rowsPerPage + $index + 1}}
          </td>
          <td v-for="col in columns" v-bind:class="{'selectedRow':isSelected(row)}">
            <editable-cell v-if="col.editable"
              :row="row"
              :row-id="getPath(row, primaryKeyForRow)"
              :path="col.path"
              :value="getPath(row, col.path)" >
            </editable-cell>
            <span v-if="!col.editable && !col.rawHTML">
              {{ getPath(row, col.path) | applyFilter col.filter }}
            </span>
            <span v-if="!col.editable && col.rawHTML">
              {{{ getPath(row, col.path) | applyFilter col.filter }}}
            </span>
          </td>
        </tr>
      </tbody>
    </table>
    <div class="row">
      <div v-if="positionOfSearch=='bottom'" class="col-sm-2 text-left">
        <input name="query" v-model="searchQuery" placeholder="{{localizedTexts.searchFilter}}"/>
      </div>
      <!-- pager for doogie table -->
      <div class="col-sm-8 text-center">
        <nav v-if="lastPageIndex > 0">
          <ul class="pagination">
            <li v-if="page-adjacentPages >= 1">
              <a href="#" @click.prevent="page = 0">1</a>
            </li>
            <li class="disabled" v-if="page-adjacentPages > 1">
              <a href="#" class="narrowEllipsis">...</a>
            </li>
            <li
              v-for="pageIndex in currentPages"
              v-if="pageIndex <= lastPageIndex"
              v-bind:class="isActivePage(pageIndex)?'active':''">
              <a href="#" @click.prevent="page = pageIndex">{{pageIndex+1}}</a>
            </li>
            <li class="disabled" v-if="page+adjacentPages < lastPageIndex-1">
              <a href="#" class="narrowEllipsis">...</a>
            </li>
            <li v-if="page+adjacentPages < lastPageIndex">
              <a href="#" @click.prevent="page = lastPageIndex">{{lastPageIndex+1}}</a>
            </li>
          </ul>
        </nav>
      </div>
      <div v-if="showAddButton" class="col-sm-2 text-right">
        <button type="button" class="btn btn-default btn-sm" @click="addRow()">
          <i class="fa fa-plus-square" aria-hidden="true"></i> {{localizedTexts.addButton}}
        </button>
      </div>
    </div>
  </div>

</template>

<script>

import _ from 'lodash'
import Vue from 'vue'
import moment from 'moment'


export default {
  props: {
    //  Array of columns, eg. [ { title: "Col Title", path: "path.in.rest.response", filter: 'fromNow' }, { ... } ]
    columns: { type: Array, required: true },

    // vue-resource for fetching data. columns.path  must match the returned Object structure
    resource: { type: Object, required: false },

    // raw rowData for client only table
    // You MUST set either resource or rowData !
    rowData: { type: Array, required: false, default: function(){return null} },

    // which path in resource data is the primary key for each row (rowID)
    primaryKeyForRow: { type: String, required: true },

    // shows a loading text
    loading: false,

    localizedTexts: {
      type: Object,
      required: false,
      default: function() {    //TODO: merge with what has been passed
        return {
          loadingText: 'Loading data ...',
          emptyData: 'Empty data',
          searchFilter: 'Search/Filter',
          addButton: 'Add'
        }
      }
    },

    // how many rows per page shall be shown in the table?
    rowsPerPage:    { type: Number, required: false, default: 10 },

    // pager width: number of li elements to left and right of the current page index (plus first/last page)
    adjacentPages:  { type: Number, required: false, default:  2 },

    // show rowNumbers (of filtered result) in first column
    showRowNumbers: { type: Boolean, required: false, default: true },

    // button for adding a new row. Will fire the 'addButtonClicked' event
    showAddButton: true,

    // shall rows be selecteable via click
    selectableRows: false,

    // 'top' or 'bottom'
    positionOfSearch: 'bottom'
  },

  data () {
    return {
      searchQuery: '',                 // filter by searching every cell's content by partial text match
      sortByCol: this.columns[0],      // by default sort by first col (thers must be a first col!)
      sortOrder: 1,
      page: 0,                         // currently shown page. 0 is first page!
      resourceError: '',
      selectedRow: null
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
    },
  },

  methods: {
    // called when header is clicked. Reverses the sort order on each click
    setSortCol(col) {
      if (typeof col == "number") col=this.columns[col]
      this.sortByCol = col
    },

    // invert the sort order of the current column sort (ascending/descending)
    invertSortOrder() {
      this.sortOrder = this.sortOrder * -1
    },

    // called when header is clicked: Will sort by this column and invert sort order on subsequent clicks
    clickHeader(col) {
      this.setSortCol(col)
      this.invertSortOrder()
    },

    // return true when this column is selected (has been clicked on)
    isSelected(row) {
      return row == this.selectedRow
    },

    // comparing two rows for sorting. (needs some massaging in javascript when localized.)
    comparator(row1,row2) {
      if (!this.sortByCol) return 0;
      var val1 = _.get(row1, this.sortByCol.path)
      var val2 = _.get(row2, this.sortByCol.path)
      return val1.localeCompare(val2, 'lookup', { numeric: true } )  // 'lookup' stands for: lookup current locale  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl#Locale_identification_and_negotiation
    },

    // pick the Vue utility function 'getPath' and make it available in our template above
    getPath: Vue.parsers.path.getPath,

    // get filtered data (needed in pagination child component)
    getFilteredData() {
      return Vue.filter('filterBy')(this.rowData, this.searchQuery)
    },

    // highlights current page in pagination
    isActivePage(index) {
      return index == this.page
    },

    // dispatch event when a row was clicked
    rowClicked(row) {
      if (this.selectableRows) {
        this.selectedRow = row
      }
      this.$dispatch('rowClicked', row)
    },

    //dispatch an event so that the parent component can for example show a popup where the new entry can be created.
    addRow() {
      this.$dispatch('addButtonClicked')
    },

    hasRemoteData() {
      return this.resource && _.isFunction(this.resource.get)
    },

    // Load rowData from restEndpoint
    reload() {
      this.loading = true
      this.resourceError = ''
      var params = {}  //for example { q: "{ title: { $regex: 'idea', $options: 'i' }}" }  for a search query
      //console.log("DoogieTable: sending request to resource")
      this.resource.get(params).then((response) => {
        //console.log("DoogieTable: got data from resource: ", response.json())
        this.rowData = response.json();
        this.loading = false
        this.$nextTick(function() {
          this.$dispatch('DoogieTable:dataLoaded', this.rowData)    // dispatch event to parent component
        })
      }, (err) => {
        console.error(err)
        this.resourceError = 'ERROR while loading'
      })
    }
  },

  filters: {
    // this filter returns only the data for the current page
    paginationFilter(data) {
      return data.slice(this.page*this.rowsPerPage, this.page*this.rowsPerPage + this.rowsPerPage)
    },

    // applies a filter/conversion to val given by filterName from this component or any of its parents
    applyFilter(val, filterName) {
      if (!filterName) return val;
      var filterFunc = undefined, vueComp = this
      //walk up the chain of $parent components and try to find filter by filterName
      while (filterFunc === undefined && vueComp != null && vueComp != vueComp.$parent) {
        filterFunc = vueComp.$options.filters[filterName]
        if (_.isFunction(filterFunc)) {
          return filterFunc(val)
        }
        vueComp = vueComp.$parent
      }
      return val
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
    // This event is fired by editable-cell when a cell's value has been edited.
    // The value in rowData has already been synced.
    // Here we update the value in the remote DB (if there is any remote resource).
    'saveNewValue': function(rowId, key, value) {
      //console.log("saveNewValue event in DoogieTable:", rowId, "#"+key+"#", value);
      if (this.hasRemoteData()) {
        var updateOp = { "$set" : {} }
        updateOp["$set"][key] = value
        this.resource.update({id: rowId}, updateOp)
        .then((response) => {
          if (response.status == 200) {
            console.log("saved new value '"+value+"' successfully to DB in rowId="+rowId)
          } else {
            console.error("Could not save new value: ", response)
          }
        })
      }
      return true  // let the event bubble further up
    }
  },

  ready () {
    if (this.resource === undefined && this.rowData == null) {
      console.warn("You did not pass any data into DoogieTable. You must either set the 'resource' or the 'rowData' property.")
      this.rowData = [];
    }
    if (this.hasRemoteData()) {
      this.reload()
    }
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

.pagination > li > a.narrowEllipsis {
  padding-left: 2px;
  padding-right: 2px;
}

.pagination > li.disabled > a:hover {
  cursor: default;
}

.pagination > li > a:hover {
  cursor: pointer;
}

.selectedRow {
  color: white;
  background: #337ab7;
}
</style>
