# liquido-vue-frontend

> Frontend for my liquid democracy app written with Vue 2.0 

See [liquido-backend-spring](https://github.com/Doogiemuc/liquido-backend-spring) for the backend implementation.

This is my playground for learning the client side Java script framework [Vue 2.0](https://vuejs.org). Meanwhile this grew to a medium sized "single page application" (SPA) with quite some nice features.

# Liquido Architecture

![Liquido Architecture](./doc/Liquido Architecture.png)

## Dependencies / Tools used

 * [Vue 2.0](http://vuejs.org/guide/) - Client side MVC JS lib (comparable to AngularJS but different :-)
 * [Vue-loader](http://vuejs.github.io/vue-loader) Load components from .vue files
 * [Vue-router](http://router.vuejs.org/) - URL navigation for single page applications
 * Of course see [package.json](https://github.com/Doogiemuc/liquido-vue-frontend/blob/master/package.json) for full details
 
## Features

 * HTML, JS and CSS is packed and bundeld with Webpack
 * Local client side caching in the SPA
 * Clean API client for REST full backend
 * A powerfull homebrew Vue Table component with filtering, sorting and pagination
 * Tests, tests and more tests.  I am a big fan of TDD!

## Build Setup

- `npm run dev`: first-in-class development experience.
  - Webpack + `vue-loader` for single file Vue components.
  - State preserving hot-reload
  - State preserving compilation error overlay
  - Lint-on-save with ESLint
  - Source maps

- `npm run build`: Production ready build.
  - JavaScript minified with [UglifyJS](https://github.com/mishoo/UglifyJS2).
  - HTML minified with [html-minifier](https://github.com/kangax/html-minifier).
  - CSS across all components extracted into a single file and minified with [cssnano](https://github.com/ben-eb/cssnano).
  - All static assets compiled with version hashes for efficient long-term caching, and a production `index.html` is auto-generated with proper URLs to these generated assets.

- `npm run smoke`: Very fast smoke tests written with Jasmine.
  - No browser involed, but blazingly fast.

- `npm run unit`: Unit tests run in PhantomJS with [Karma](http://karma-runner.github.io/0.13/index.html) + [Mocha](http://mochajs.org/) + [karma-webpack](https://github.com/webpack/karma-webpack).
  - Supports ES2015 in test files.
  - Supports all webpack loaders.
  - Easy mock injection.

- `npm run e2e`: End-to-end tests with [Nightwatch](http://nightwatchjs.org/).
  - Run tests in multiple browsers in parallel.
  - Works with one command out of the box:
    - Selenium and chromedriver dependencies automatically handled.
    - Automatically spawns the Selenium server.



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
