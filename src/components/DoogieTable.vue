/**
  Localizable boostrap table with sorting, filtering and paging.
  Cells can be edited in-place.

  Features:
    - Each row is represented by one object. The keys can have any format.
    - Cell values can be converted/filtered before shown to the user. E.g. date values can be localized or even be converted to something like "a few moments ago".
    - The table is sortable by each column.
    - Optionally row numbers can be shown
    - A Search/Filter input field for client side filtering can be enabled. 
    - Localisatzion support

  Usage:
  <doogie-table
    :rowData="dataArray"
    :columns="columnsArray"
    :primary-key-for-row="nameOrPathOfprimaryKeyAttribute"
    :show-add-button="true"
  >
  </doogie-table>

  tableColumnsExample: [
    { title: "Title", path: "nameOfTitleAttribute" },
    { title: "Description", path: "description", editable: true  },
    { title: "deepField", path: "some.deep.path.to.imgHref" ,filter: 'userAvatar', rawHTML: true },
  ]
  
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
            <span v-if="sortByCol == col" class="arrow" :class="sortOrder > 0 ? 'asc' : 'dsc'"></span>
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
        <tr v-for="(row, index) in getRowDataForCurrentPage" @click="rowClicked(row)" :key="getPath(row, primaryKeyForRow)">
          <th v-if="showRowNumbers">
            {{page*rowsPerPage + index + 1}}
          </th>
          <td v-for="col in columns" v-bind:class="{'selectedRow':isSelected(row)}">
            <editable-cell 
              v-if="col.editable"
              :pk="getPath(row, primaryKeyForRow)"
              :column="col"
              :value="getFilteredCellValue(row, col.path, col.filter)" 
              v-on:saveNewValue="saveNewValue">
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

    //TODO: LARGE: Make cells editable with their own custom "editor" component, such as a date picker

    //  Array of columns, eg. [ { title: "Col Title", path: "path.in.rest.response", filter: 'fromNow' }, { ... } ]
    columns: { type: Array, required: true },

    // raw rowData, that will then be filtered and sorted
    rowData: { type: Array, required: true, default: function() { return [] } },

    // this callback will be called, when a cell value has been edited.
    updateHandler: { type: Function, required: false },

    // which path in rowData is the primary key for each row (only needed when columns are editable)
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
      sortOrder: 1,										 // initial sort order is ascending
      page: 0,                         // currently shown page. 0 is first page!
      message: '',                     // A message that is shown in the first row, e.g "loading" or can be used for error messages
      selectedRow: null
    }
  },

  components: {
    'editable-cell' : require("./EditableCell")
  },

  //These computed properties are cached. See https://vuejs.org/v2/guide/computed.html#Computed-Properties
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
    
    // Get filtered row data (if any searchQuery is set).
    // Matches on the cell values as the user sees them! (ignoring case)
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
      return result
    },

    // get filtered and sorted row data for current page only
    getRowDataForCurrentPage() {
      // apply filter (if any)
      var result = this.getFilteredRowData
      // sort
      if (this.sortByCol) {
        result = result.slice().sort(this.comparator)   // need to make a copy of the array!
      }
      // slice out data for current page only
      result = result.slice(this.page*this.rowsPerPage, this.page*this.rowsPerPage + this.rowsPerPage)
      return result
    }

  },

  methods: {
    // set the column that the table is sorted by
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
      if (_.isString(val1)) {
        return val1.localeCompare(val2, 'lookup', { numeric: true } ) * this.sortOrder // 'lookup' stands for: lookup current locale  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl#Locale_identification_and_negotiation
      } else {
      	return (val1 < val2) * this.sortOrder
      }
    },

    // called when header is clicked: Will sort by this column and invert sort order on subsequent clicks
    clickHeader(col) {
      this.setSortCol(col)
      this.invertSortOrder()
      //console.log("$forceUpdate")
      //this.$forceUpdate()
    },

    // index of last page (after applying filter)
    lastPageIndex() {
      var filteredRowData = this.getFilteredRowData
      return Math.max(0, Math.ceil(filteredRowData.length / this.rowsPerPage) - 1)
    },

    // get a cell value for viewing in table cell. Will Apply the colFilter with the give name
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

    // return true when this column is selected (has been clicked on)
    isSelected(row) {
      return row == this.selectedRow
    },

    /**
     * Get a row from rowData by its primary ky
     * @param pk the primaryKey (ID) of a row in rowData
     * @return the row from rowData with that primary key or undefind in no row has that ID.
     */
    getRowByPk(pk) {
      for (var i = 0; i < this.rowData.length; i++) {
        if (this.getPath(this.rowData[i], this.primaryKeyForRow) === pk) {
          return this.rowData[i]
        }
      }
      return undefined
    },

    /**
     * Event callback when cell was edited. Will update our internal data and then let event bubble further up.
     * @param pk  primary key for entity in this row
     * @param col The column configuration (we need the path)
     * @param value the newly entered value
     */
    saveNewValue(pk, col, value) {
      console.log("saveNewValue event in DoogieTable:", pk, col, value);
      // MAYBE: pass row to EditableCell and get it back here?
      var row = this.getRowByPk(pk)
      if (row !== undefined) row[col.path] = value
      this.updateHandler(pk, col, value)
      this.$emit('saveNewValue', pk, col, value)   // let event from editable cell bubble up to parent component
    },

    // emit event when a row was clicked
    rowClicked(row) {
      if (this.selectableRows) {
        this.selectedRow = row
      }
      this.$emit('rowSelected', row)
    },

    //emit an event so that the parent component can for example show a popup where the new entry can be created.
    addRow() {
      this.$emit('addButtonClicked')
    },

  },

  filters: {
    // returns a localized version of dateValue, e.g. 15.03.2016 for DE-DE
    localizeDate(dateVal) {
      return moment(dateVal).format('L');
    },

    // returns a localized string how far dataVal is in the past, e.g. "2 month ago"
    fromNow(dateVal) {
      return moment(dateVal).fromNow();
    },
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
