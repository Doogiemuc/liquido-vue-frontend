/* global expect, sinon */
import Vue from 'vue'
import DoogieTable from 'src/components/DoogieTable'

/**
 * Tests for doogies vue table component
 */
describe('DoogieTable.vue', () => {
  var fakeServer
  
  before(function() {
    //console.log("Setting up fakeServer")
    fakeServer = sinon.fakeServer.create()
  })
  
  after(function() {
    //console.log("restoring original XHR")
    fakeServer.restore()
  })
  
  
  xit('should render a table with correct content in its cells', () => {
    const vm = new Vue({
      data () {
        return {
          testColumns: [
            { title: "Column 1", path: "title" },
            { title: "Column 2", path: "description" },
           // { title: "Date Column", path: "updatedAt.$date", filter: 'fromNow' },
          ],
          testKey: "id",
          testData: [
            { id: '4711', title: "Title 1", description: "Desc 1" },
            { id: '4712', title: "Title 2", description: "Desc 2" },
            { id: '4713', title: "Title 3", description: "Desc 3" },
          ]
        }
      },
      template: '<div><doogie-table ' +
          ':row-data="testData" ' +
          ':columns="testColumns" ' +
          ':primary-key-for-row="testKey" ' +
          'v-ref:testtable >' +
          '</doogie-table></div>',
      components: { DoogieTable },
    }).$mount()
    
    const testtable = vm.$refs.testtable
    // This will trigger the 'ready' hock on the doogie-table component
    vm.$appendTo(document.body)
    // nextTick callback will be called, when the testtables DOM has been updated
    testtable.$nextTick(() => {
      //console.log("=======> testtable.nextTick ", vm.$el.querySelector('.doogie-table tr td'))
      expect(vm.$el.querySelector('.doogie-table tr td').textContent).to.contain('Title 1')
    })

  })

  it('should load data from remote resource', (done) => {
    var testData = JSON.stringify([
      { id: '4711', title: "Title 1", description: "Remote 1" },
      { id: '4712', title: "Title 2", description: "Remote 2" },
      { id: '4713', title: "Title 3", description: "Remote 3" },
    ])
    fakeServer.respondWith("GET", "/tabletestdata",
      [200, { "Content-Type": "application/json" }, testData ]
    )
    //Uncomment for debugging: 
    //sinon.log = function (message) {  console.log("SINON: ", message); };
    fakeServer.autoRespond = true;   // I couldn't get it working with calling fakeServer.respond() mamually.
    //fakeServer.respondImmediately = true;  
    
    Vue.use(require('vue-resource'));
    const vm = new Vue({
      data () {
        return {
          testResource: this.$resource('/tabletestdata'),
          testColumns: [
            { title: "Column 1", path: "title" },
            { title: "Column 2", path: "description" },
          ],
          testKey: "id",
        }
      },
      template: '<div><doogie-table ' +
          ':resource="testResource" ' +
          ':columns="testColumns" ' +
          ':primary-key-for-row="testKey" ' +
          'v-ref:remotetable >' +
          '</doogie-table></div>',
      components: { DoogieTable },
      events: {
        'DoogieTable:dataLoaded': function() {
          //console.log("=========> DoogieTabe:dataLoaded222", JSON.stringify(fakeServer.requests, ' ', 4))
          //console.log("=========> TableData is now ", vm.$el.querySelector('.doogie-table tbody tr:nth-child(1)').textContent)
          expect(vm.$el.querySelector('.doogie-table tbody tr:nth-child(1)').textContent).to.contain('Remote 1')
          done()
        }
      },
    }).$mount().$appendTo(document.body)

    //This does not work. Only the workaround with fakeServer.autoResond=true above works.
    //fakeServer.respond()
  })
})
