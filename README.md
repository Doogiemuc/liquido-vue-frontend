# liquido-vue-frontend

> Frontend for my liquid democracy app writtn with Vue.js

This is my playground for learning [Vue](https://vuejs.org). Meanwhile this grew to a medium sized "single page application" (SPA) with quite some nice features

Currently it uses VueJS 1.0   I am eventually plannign to upgrade to VueJS 2.0 soon. That will be a larger upgrade.

## Dependencies / Tools used

 * Vue
 * Vue-loader
 * Vue-router
 * MongoDB
 * RESTfull webservices

## Features

 * HTML, JS and CSS is packed and bundeld with Webpack
 * MongoDB backend (currently I connect to it via mlab.com REST API)
 * Local client side caching in the SPA
 * Database seed script
 * A powerfull Vue Table component
 * Tests, tests and more tests.  I am a big fan of TDD!

## Build Setup

``` bash
# install dependencies
npm install

# serve with hot reload at localhost:8080
npm run dev

# build for production with minification
npm run build

# run unit tests
npm run unit

# run e2e tests
npm run e2e

# run all tests
npm test
```

For detailed explanation on how things work, checkout the [guide](http://vuejs-templates.github.io/webpack/) and [docs for vue-loader](http://vuejs.github.io/vue-loader).

## History

 * 2016-12-14 21:44:46 +0000 - WORKING TinyMceComponent.vue
 * 2016-12-14 16:51:51 +0000 - Working on Add Idea - with TinyMCE
 * 2016-11-28 21:34:50 +0100 - Saving a proxy now works. With green smoke tests.
 * 2016-11-27 20:09:25 +0000 - Cleaned up logging
 * 2016-11-27 12:54:48 +0000 - Very nice working version  * Added LiquidoCache.js for application specific caching.  * runJasmineTestsWithNode.js now automatically starts the mock backend server.  * improved logging
 * 2016-11-23 14:37:47 +0000 - ProxyEdit is now working with cached data
 * 2016-11-23 09:00:13 +0000 - Working on RootApp.vue and added test case for it
 * 2016-11-20 22:20:54 +0000 - First working version of SessionCache.js
 * 2016-11-20 20:16:15 +0000 - Editing proxy - two page version
 * 2016-11-17 19:42:00 +0000 - Working on Your Proxies page
 * 2016-10-14 12:42:35 +0000 - committed merge
 * 2016-10-14 12:42:02 +0000 - merged
 * 2016-10-14 12:29:37 +0000 - Large update. HEyvy work on Delegation service. Added mock backend. All tests are green!
 * 2016-10-03 23:35:52 +0200 - getNumVotes works with local backend server
 * 2016-10-03 20:47:44 +0000 - started working on getNumVotes from server
 * 2016-08-16 21:56:45 +0000 - Green smoke tests with much better logging
 * 2016-08-16 09:51:52 +0000 - Brandnew testDataCreator. Now also allows refs in query
 * 2016-08-11 19:35:54 +0000 - BaseRestClient is now a real singleton
 * 2016-08-08 19:39:48 +0000 - GREEN TESTS for BaseRestWebservice, now with JSONschmea validation
 * 2016-08-04 15:36:19 +0000 - added smoke tests with jasmine
 * 2016-08-03 09:17:14 +0000 - Working tests for population
 * 2016-08-02 20:03:26 +0000 - Tests for IdeaService and BaseRestService are green
 * 2016-07-31 22:23:02 +0000 - WORKING User and Idea Service. Highly optimized! With cache.
 * 2016-07-28 22:11:07 +0000 - Started working on UserService.js
 * 2016-07-26 12:14:31 +0000 - Working E2E Test for DoogieTable filtering
 * 2016-07-26 07:58:45 +0000 - Working on nightwatch.js E2E tests
 * 2016-07-26 07:55:22 +0000 - Working on nightwatch.js E2E tests
 * 2016-07-26 07:23:18 +0000 - Got testcases running with vue-resource interceptor
 * 2016-07-25 19:50:11 +0000 - Unit tests for DoogieTable are up and running. $> npm run unit
 * 2016-07-24 20:57:18 +0000 - a lot of work on DoogieTable. Now comes with first unit tests.
 * 2016-07-21 11:21:30 +0000 - DoogieTable is working with pager
 * 2016-07-18 19:27:56 +0000 - Working version of DoogieDataTable. With paging!
 * 2016-07-18 06:30:04 +0200 - Working on Proxies page and rowIndex of editable table
 * 2016-07-15 21:06:33 +0200 - Got testDataCreator back up working, with
 * 2016-07-14 23:51:01 +0200 - Working version of edit with vue-resource
 * 2016-07-14 23:05:13 +0200 - Working version with edit and update to DB
 * 2016-07-12 18:14:06 +0000 - working version of listIdeas
 * 2016-07-12 07:46:24 +0000 - EditableCell in vue-tables with loading spinner
 * 2016-07-03 21:21:20 +0000 - First nice working version of TestDataCreator
 * 2016-06-20 21:12:40 +0200 - Initial commit

`git log --pretty=format:" * %ci - %s"`
