/**
  # Localizable boostrap table with sorting, filtering and paging.
  
  ### Features
    - Cells can be edited in-place with x-editable.
    - Each row is represented by one object. Any attribute of this object can be the primary key for each row.
    - Cell values can be converted/filtered before shown to the user. E.g. date values can be localized or even be converted to something like "a few moments ago".
    - The table is sortable by each column. The sorting is local aware and correct for number with leading zeros.
    - Intelligent pager
    - Localisation support

  ### Usage
  ````
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
    { title: "deepField", path: "some.deep.path.to.imgHref", vueFilter: 'userAvatar', rawHTML: true, comparator: createdByComparator },
  ]
  ````

  ### Properties of DoogieTable vue component
  * rowData: array of row objects
  * columns: configuration of columns, see below
  * primary-key-for-row: name of (or path to) attribute that is the primary key for each row. Values must be unique! 
  * rows-per-page: How many rows shall be shown on each page. If there is more data, then a pager will allow the user to navigate to other pages.
  * adjacent-pages: How many page numbers shall be shown in the middle of the pager. Default is 2.
  * show-add-button: (Optional) should an add button be shown at the bottom right of the table.
  * updateHandler: (Function) will be called when cell was edited.

  ### Configuration of columns
   * title: The (localized) title that is shown at the top of that column
   * path: name of attribute or path to the value in row object for each cell in this column, e.g  "profile.name"
   * rawHTML: (Optional) wether the value shall be shown as rawHTML. HTML tags won't be escaped. This way you can for example show images or buttons in cells.
   * vueFilter: (Optional) name of custom vue filter that converts the raw value from row object to the HTML representation that is shown in the cell.
   * comparator: (Optional) local aware comparator that compares two rows and shall return -1, 0 or 1

  ### Roadmap
 
   * TODO: Implement a scrolling table, that dynamically loads further rows as necessary.
   * TODO: LARGE: Make cells editable with their own custom "editor" component, such as a date picker. Found possible solution with Vue's dynamic components!

 */

<template>
  <div id="DoogieTableWrapper">
    <table class="table table-condensed table-bordered table-hover doogie-table">
      <thead>
        <tr>
          <th v-if="showRowNumbers">&nbsp;</th>
          <th v-for="col in columns"
            @click="clickHeader(col)"
            :class="{active: sortByCol == col}">
            <span v-if="col.htmlTitle" v-html="col.htmlTitle"></span>
            <span v-else>{{ col.title }}</span>
            <span v-if="sortByCol == col" class="arrow" :class="sortOrder > 0 ? 'asc' : 'dsc'"></span>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="message">
          <td v-bind:colspan="columns.length + (showRowNumbers ? 1 : 0)">{{message}}</td>
        </tr>
				<tr v-else-if="rowData === undefined || rowData.length === 0">
          <td v-bind:colspan="columns.length + (showRowNumbers ? 1 : 0)">{{localizedTexts.emptyData}}</td>
        </tr>
        <tr v-else-if="getFilteredRowData.length === 0">
          <td v-bind:colspan="columns.length + (showRowNumbers ? 1 : 0)">{{localizedTexts.filterdResultEmpty}}</td>
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
              :value="getDisplayValue(row, col)"
              v-on:saveNewValue="saveNewValue">
            </editable-cell>
						<component v-else-if="col.renderComponent" :is="col.renderComponent" :row="row" :col="col"></component>
            <component v-else-if="col.editComponent"   :is="col.editComponent"   :row="row" :col="col" :index="index" v-bind="col.editCompProps"></component>
						<span v-else-if="col.rawHTML" v-html="getDisplayValue(row, col)"></span>
						<span v-else>
              {{ getDisplayValue(row, col) }}
            </span>
          </td>
        </tr>
      </tbody>
    </table>
    <div class="row">
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
        <span>showAddButton = {{showAddButton}}</span>
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
    columns: { type: Array, required: true },   //TODO: add validator function for columns object

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
          addButton: 'Add',
          filterdResultEmpty: 'Filtered result is empty. Choose less strict filters.',
        }
      }
    },

    // how many rows per page shall be shown in the table?
    rowsPerPage:    { type: Number, required: false, default: 10 },

		// A message that is shown in the first row, e.g "loading" or can be used for error messages
		message: { type: String, required: false, default: "" },
		
    // pager width: number of li elements to left and right of the current page index (plus first/last page)
    adjacentPages:  { type: Number, required: false, default:  2 },

    // show rowNumbers (of filtered result) in first column
    showRowNumbers: { type: Boolean, required: false, default: true },

    // button for adding a new row. Will fire the 'addButtonClicked' event
    showAddButton: { type: Boolean, required: false, default: false },

    // shall rows be selecteable via click
    selectableRows: { type: Boolean, required: false, default: false },
		
		// client side filtering of tableData. When rowFilterFunc(row) returns false, that row will not be shown.
		rowFilterFunc: { type: Function, required: false },

  },

  data () {
    return {
      sortByCol: this.columns[0],      // by default sort by first col (thers must be a first col!)
      sortOrder: 1,										 // initial sort order is ascending
      page: 0,                         // currently shown page. 0 is first page!      
      selectedRow: null								 // currently selected row
    }
  },

  components: {
    'editable-cell' : require("./EditableCell")
  },

  //These computed properties are cached. See https://vuejs.org/v2/guide/computed.html#Computed-Properties
  computed: {
    /** 
		 * Array of current page indexes that are shown in the middle of the pagination component
     * (A field with first and last page is always shown at the very left and right of my pager.)
		 * @return {array} Array of page indexes
		 */
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
    
    /** 
     Get rows that match a given filter 'this.rowFilterFunc'
     adapted from https://github.com/vuejs/vue/blob/4f5a47d750d4d8b61fe3b5b2251a0a63b391ac27/examples/grid/grid.js
     and updated to Vue 2.0:  https://vuejs.org/v2/guide/migration.html#Filters
     This is a computed property. Its result is cached by Vue.
     Do not confuse this with Vue's "filter" for converting values to display values!
    */
    getFilteredRowData() {
      if (this.rowData === undefined) return []
			if (typeof this.rowFilterFunc !== "function") return this.rowData
      return this.rowData.filter(row => this.rowFilterFunc(row))
    },

    /** 
     Get filtered and sorted row data for current page only.
     Here this.sortOrder is used when sorting.
		 @return the subarray of this.rowData with the elements for the current page only.
    */
    getRowDataForCurrentPage() {
      var result = this.getFilteredRowData  // first apply filter
      if (this.sortByCol) {									// then sort
        var compFunc = this.sortByCol.comparator || this.localAwareComparator;
        var compFuncWithOrder = (row1, row2) => {
          return compFunc(row1, row2) * this.sortOrder
        }
        result = result.slice().sort(compFuncWithOrder)   // need to make a copy of the array!
      }
      // slice out data for current page only
      result = result.slice(this.page*this.rowsPerPage, this.page*this.rowsPerPage + this.rowsPerPage)
      return result
    }

  },
	
	watch: {
		/**
		 * When the filtered number of rows changes, because the filter settings changed, then 
		 * it might be that we have to jump to a smaller last page index.
		 */
		getFilteredRowData: function(newValue) {
			var lastIdx = this.lastPageIndex()
			if (this.page > lastIdx ) { this.page = lastIdx }
		}
	},

  methods: {
    /** 
		 * Visually sort the rows in the table by this column.  (this.rowData will not be changed by this action.)
		 * @param {object} col one element from columns array
		 */
    setSortCol(col) {
      if (typeof col == "number") col=this.columns[col]
      this.sortByCol = col
    },

    /** invert the sort order of the current column sort (ascending/descending) */
    invertSortOrder() {
      this.sortOrder = this.sortOrder * -1
    },

    /** 
     * Compare two rows for sorting. Needs some massaging in javascript when localized.)
     * Even _.sortBy does not correctly sort localized strings, but sorting is a religion anyway.
     * E.g. how would you sort "03", "025" and "000"  ?
     * @param row1, row2  the two rows to compare by the current value of their key `sortByCol.path`
     * @return -1, 0 or 1  depending of the comparison of row[sortByCol.path] values.
     */
    localAwareComparator(row1,row2) {
      if (!this.sortByCol || row1 === undefined || row2 === undefined) return 0
      var val1 = _.get(row1, this.sortByCol.path)
      var val2 = _.get(row2, this.sortByCol.path)
      if (val1 === undefined || val2 == undefined) return 0
      if (_.isString(val1)) {
        // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/localeCompare
        // 'lookup' - lookup current locale   https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl#Locale_identification_and_negotiation
        // {numeric: true} - Use numeric collation, so that "1" < "2" < "10"
        return val1.localeCompare(val2, 'lookup', { numeric: true } )
      } else {
      	return (val1 < val2) ? -1 : (val1 > val2) ? 1 : 0
      }
    },

    /** Called when a header is clicked: Will sort by this column and invert sort order on subsequent clicks */
    clickHeader(col) {
      this.setSortCol(col)
      this.invertSortOrder()
    },

    /** @return index of last page (after applying filter) */
    lastPageIndex() {
      var filteredRowData = this.getFilteredRowData
      return Math.max(0, Math.ceil(filteredRowData.length / this.rowsPerPage) - 1)
    },

    /** 
		 * Get the value (or HTML) that shall be shown in a cell. Will Apply vue's colFilter for transformation.
		 * Do not confuce Vue's "filter" (which should be called converters) with the filtering of row data!
		 * @param {Object} row one element from rowData array
		 * @param {Object} col one element from columns array
		 * @return {String} the value to display in this cell (mapped by Vue filter)
		 */
    getDisplayValue(row, col) {
      var cellValue = this.getPath(row, col.path)
      return this.applyVueFilter(cellValue, row, col.vueFilter)
    },

    /** 
		 * applies a Vue filter/conversion given by 'filterName' to 'val' from this component or any of its parents
		 * @param {String} val cell's raw value from rowData
		 * @param {Object} the full row object. An element from rowData. (Can be used when the cell's display value depends on other values in this row.)
		 * @param {String} filterName name of a vueFilter. Can be one of the default filters in DoogieTable, e.g. 'localizeDate' or any filter you defined in any parent component.
		 * @return {String} the converted display value, that shall be shown to the user in this table cell. Can be interpreted as rawHTML, when column.rawHTML is true.
		 */
    applyVueFilter(val, row, filterName) {
      if (!filterName) return val;
      var converterFunc = undefined, vueComp = this
      //walk up the chain of $parent components and try to find a converterFunc with filterName
      while (converterFunc === undefined && vueComp != null && vueComp != vueComp.$parent) {
        converterFunc = vueComp.$options.filters[filterName]
        if (_.isFunction(converterFunc)) {
          return converterFunc(val, row)
        }
        vueComp = vueComp.$parent
      }
      return val
    },

    // pick the lodash utility function 'get path in object' and make it available in our template
    getPath: _.get,

    /** Will highlights current page in pagination */
    isActivePage(index) {
      return index == this.page
    },

    /** @return {boolean} true when this column is selected (has been clicked on) */
    isSelected(row) {
      return row == this.selectedRow
    },

		/** 
		 * Get the <b>unfiltered</b> index of row in this.rowData array.  Compares on object equality. Not just primaryKey!
		 * @param {object} row one element from this.rowData
		 * @return {integer} index so that this.rowData[index] === row  
		 */
		getIndexOf(row) {
			for (var i = 0; i < this.rowData.length; i++) {
				if (this.rowData[i] == row) return i
			}
			return -1
		},
		
    /**
     * Get a row from rowData by its primary key
     * @param pk the primaryKey (ID) of a row in rowData. The attribute configured in "this.primaryKeyForRow"
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

    /** emit "rowSelected" event when this.selectableRows == true and a row was clicked */
    rowClicked(row) {
      if (this.selectableRows) {
        this.selectedRow = row
      }
      this.$emit('rowSelected', row)
    },

    /** emit an event so that the parent component can for example show a popup where the new entry can be created. */
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

<style scoped>
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
