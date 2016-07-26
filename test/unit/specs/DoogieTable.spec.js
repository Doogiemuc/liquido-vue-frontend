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
    //fakeServer = sinon.fakeServer.create()
  })
  
  after(function() {
    //console.log("restoring original XHR")
    //fakeServer.restore()
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

  it('can load data from remote vue-resource', (done) => {
    var testData = JSON.stringify([
      { id: '4711', title: "Title 1", description: "Remote 1" },
      { id: '4712', title: "Title 2", description: "Remote 2" },
      { id: '4713', title: "Title 3", description: "Remote 3" },
    ])
    
    Vue.use(require('vue-resource'));
    Vue.http.interceptors.push((request, next) => {
      if (request.url == '/tabletestdata') {
        console.log('Intercepting request to '+request.url+ '. Sending reply with canned testdata.')
        // stop and return response
        next(request.respondWith(testData, { status: 200, statusText: 'Ok' }))
      } else {
        next()
      }
    });
    
    /*  
    // I tried to get this running with sinon.fakeServer. 
    // It works when setting fakeServer.autoRespond = true. But according to the sinson docs, this should not be used for production ready tests.
    // It I didn't get it working with manually callign fakeServer.respond() anywhere.
    fakeServer.respondWith("GET", "/tabletestdata",
      function(xhr) {
        console.log("********** responding to GET /tabletestdata")
        console.log("###### requests=", JSON.stringify(fakeServer.requests, ' ', 2))
        xhr.respond(200, { "Content-Type": "application/json" }, testData)
      }
    )
    //for debugging: 
    sinon.log = function (message) {  console.log("SINON: ", message); };
    fakeServer.autoRespond = true;   // I couldn't get it working with calling fakeServer.respond() mamually.
    //There would also be a   fakeServer.respondImmediately = true;  
    */
    
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
          console.log("DoogieTabe:dataLoaded event received."); //, JSON.stringify(fakeServer.requests[0].responseText, ' ', 4))
          expect(vm.$el.querySelector('.doogie-table tbody tr:nth-child(1)').textContent).to.contain('Remote 1')
          done()
        }
      },
    }).$mount().$appendTo(document.body)

    /*
    //This does not work. Only the workaround with fakeServer.autoResond=true above works.
    console.log("###### requests=", JSON.stringify(fakeServer.requests, ' ', 2))
    vm.$nextTick(function() {
      console.log("###### $nextTick requests=", JSON.stringify(fakeServer.requests, ' ', 2))
      fakeServer.respond()  
    })
    */
  })
})
