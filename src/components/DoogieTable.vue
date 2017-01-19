/**
  Localizable boostrap table with sorting, filtering and paging.

  Features:
    - Each row is represented by one object. The keys can have any format.
    - Cell values can be converted from the source object before shown in a cell.
    - Sortable by each column
    - Optional Row numbers
    - Search/Filter input (client side filtering!)
    - Localisatzion support

  Usage:
  <doogie-table
    :rowData="dataArray"
    :columns="columnsArray"
    :primary-key-for-row="nameOrPathOfprimaryKeyAttribute"
    :show-add-button="true"
  >
  </doogie-table>

 */

<template>
  <div id="DoogieTableWrapper">
    <div v-if="positionOfSearch=='top'" id="searchDiv">
      <input name="query" v-model="searchQuery" v-bind:placeholder="localizedTexts.searchFilter"/>
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
        <tr v-if="rowData == undefined || rowData.length == 0">
          <td v-bind:colspan="columns.length + (showRowNumbers ? 1 : 0)">{{localizedTexts.emptyData}}</td>
        </tr>
        <tr v-if="message">
          <td v-bind:colspan="columns.length + (showRowNumbers ? 1 : 0)">{{message}}</td>
        </tr>
        <tr v-for="(row, index) in getRowDataForCurrentPage()" @click="rowClicked(row)">
          <th v-if="showRowNumbers">
            {{page*rowsPerPage + index + 1}}
          </th>
          <td v-for="col in columns" v-bind:class="{'selectedRow':isSelected(row)}">
            <editable-cell v-if="col.editable"
              :row="row"
              :row-id="getPath(row, primaryKeyForRow)"
              :path="col.path"
              :value="getPath(row, col.path)" >
            </editable-cell>
            <span v-if="!col.editable && !col.rawHTML">
              {{ getFilteredCellValue(row, col.path, col.filter) }}
            </span>
            <span v-if="!col.editable && col.rawHTML" v-html="getFilteredCellValue(row, col.path, col.filter)"></span>
          </td>
        </tr>
      </tbody>
    </table>
    <div class="row">
      <div v-if="positionOfSearch=='bottom'" id="searchDiv" class="col-sm-2 text-left">
        <input name="query" v-model="searchQuery" v-bind:placeholder="localizedTexts.searchFilter"/>
      </div>
      <!-- pager for doogie table -->
      <div class="col-sm-8 text-center">
        <nav v-if="lastPageIndex() > 0">
          <ul class="pagination">
            <li v-bind:class="isActivePage(0)?'active':''">
              <a href="#" @click.prevent="page = 0">1</a>
            </li>
            <li class="disabled" v-if="page-adjacentPages > 1">
              <a href="#" @click.prevent class="narrowEllipsis">...</a>
            </li>
            <li
              v-for="pageIndex in currentPages"
              v-bind:class="isActivePage(pageIndex)?'active':''">
              <a href="#" @click.prevent="page = pageIndex">{{pageIndex+1}}</a>
            </li>
            <li class="disabled" v-if="page+adjacentPages < lastPageIndex()-1">
              <a href="#" @click.prevent class="narrowEllipsis">...</a>
            </li>
            <li v-bind:class="isActivePage(lastPageIndex())?'active':''">
              <a href="#" @click.prevent="page = lastPageIndex()">{{lastPageIndex()+1}}</a>
            </li>
          </ul>
        </nav>
      </div>
      <div v-if="showAddButton" class="col-sm-2 text-right">
        <button type="button" class="btn btn-primary btn-sm" @click="addRow()">
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

    // raw rowData, that will then be filtered and sorted
    rowData: { type: Array, required: true, default: function() { return [] } },

    // which path in rowData is the primary key for each row (rowID)
    primaryKeyForRow: { type: String, required: true },

    // text snippets that can be localized
    localizedTexts: {
      type: Object,
      required: false,
      default: function() {    //TODO: merge with what has been passed
        return {
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

    // 'top', 'bottom' or 'none'
    positionOfSearch: { type: String, default: function() { return 'bottom' } }
  },

  data () {
    return {
      searchQuery: '',                 // filter by searching every cell's content by partial text match
      sortByCol: this.columns[0],      // by default sort by first col (thers must be a first col!)
      sortOrder: 1,
      page: 0,                         // currently shown page. 0 is first page!
      message: '',                     // message shown in the first row, e.g "loading" or for error messages
      selectedRow: null
    }
  },

  components: {
    'editable-cell' : require("./EditableCell")
  },

  computed: {
    // Array of current page indexes that are shown in the middle of the pagination component
    // (A field with first and last page is always shown at the very left and right of my pager.)
    currentPages() {
      var firstIndexInPager = Math.max(1, this.page - this.adjacentPages)
      var lastIndexInPager  = Math.min(this.lastPageIndex()-1, this.page + this.adjacentPages)
      var len = lastIndexInPager - firstIndexInPager + 1
      var result = new Array()
      for (var i = len-1; i >= 0; i--) {
        result[i] = firstIndexInPager + i
      }
      return result
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

    // comparing two rows for sorting. (needs some massaging in javascript when localized.)
    comparator(row1,row2) {
      if (!this.sortByCol) return 0;
      var val1 = _.get(row1, this.sortByCol.path)
      var val2 = _.get(row2, this.sortByCol.path)
      return val1.localeCompare(val2, 'lookup', { numeric: true } ) * this.sortOrder // 'lookup' stands for: lookup current locale  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl#Locale_identification_and_negotiation
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

    // index of last page (after applying filter)
    lastPageIndex() {
      var filteredRowData = this.getFilteredRowData()
      return Math.max(0, Math.ceil(filteredRowData.length / this.rowsPerPage) - 1)
    },

    // Get filtered row data (if any searchQuery is set).
    // Matches on the cell values as the user sees them!
    // adapted from https://github.com/vuejs/vue/blob/4f5a47d750d4d8b61fe3b5b2251a0a63b391ac27/examples/grid/grid.js
    // and updated to Vue 2.0:  https://vuejs.org/v2/guide/migration.html#Filters
    getFilteredRowData() {
      if (this.rowData == undefined) return []
      if (this.searchQuery == undefined || this.searchQuery == '') return this.rowData
      var result = this.rowData
      var that = this
      var filterKey = this.searchQuery.toLowerCase()
      result = result.filter(function (row) {
        return that.columns.some(function(col) {
          var cellValue = that.getFilteredCellValue(row, col.path, col.filter)
          return cellValue.toLowerCase().indexOf(filterKey) > -1
        })
      })
      //console.log("getFilteredRowData: ", result)      
      return result
    },

    // get filtered and sorted row data for current page only
    getRowDataForCurrentPage() {
      // apply filter (if any)
      var result = this.getFilteredRowData()
      // sort
      if (this.sortByCol) {
        result = result.slice().sort(this.comparator)   // need to make a copy of the array!
      }
      // slice out data for current page only
      result = result.slice(this.page*this.rowsPerPage, this.page*this.rowsPerPage + this.rowsPerPage)
      return result
    },

    // get a cell value filtered by the filter with the give name
    getFilteredCellValue(row, path, colFilter) {
      var cellValue = this.getPath(row, path)
      return this.applyFilter(cellValue, colFilter)
    },

    // applies a filter/conversion given by 'filterName' to 'val' from this component or any of its parents
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

    // pick the lodash utility function 'get path in object' and make it available in our template
    getPath: _.get,

    // highlights current page in pagination
    isActivePage(index) {
      return index == this.page
    },

    // emit event when a row was clicked
    rowClicked(row) {
      if (this.selectableRows) {
        this.selectedRow = row
      }
      this.$emit('rowClicked', row)
    },

    //emit an event so that the parent component can for example show a popup where the new entry can be created.
    addRow() {
      this.$emit('addRow')
    },

  },

  filters: {
    // this filter returns only the data for the current page
    paginationFilter(data) {
      return data.slice(this.page*this.rowsPerPage, this.page*this.rowsPerPage + this.rowsPerPage)
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
    'saveNewValue': function(rowId, key, value) {
      console.log("saveNewValue event in DoogieTable:", rowId, "#"+key+"#", value);
      return true  // let the event bubble further up
    }
  },


}
</script>

<style>
table.doogie-table {
  margin-bottom: 5px;
}

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
