# Frontend for Liquido written in Vue.js with WebPack

## Architecture

This is a HTML5 frontend for Liquido. It communicates via REST with a RestHeart backend above a mongodb.

## Development

    npm install    # to install all node_modules
    npm run dev    # will start integrated webserver on port 8080 with very nice live hot reloading

## Project Strucutre

Based on the awesome [VueJs WebPack Template](http://vuejs-templates.github.io/webpack/) [GitHub Link](https://github.com/vuejs-templates/webpack)

    src/
      components/       // Vue components - handled by vue-loader
      views/            // html layout for liquido pages
      main.js           // Vue main class with vue-router initialization  //TODO: rename to app.js   and replace all occurences
    static/             // static web resources
      css/
        Liquido.css     // global CSS definitions
      fonts/
      js/
    index.html          // main layout with header and footer
    
    
## Acess Codes

### Mongo Database as mlab.com

http://mlab.com   "Doogie" - new pwd

connect to DB  (wiht lion pwd)
`mongo ds019664.mlab.com:19664/liquido-test -u testuser -p`

mLab.com  REST API Key   1crkrQWik4p98uPiOzZiFG0Fkya0iNiU
`GET https://api.mlab.com/api/1/databases?apiKey=1crkrQWik4p98uPiOzZiFG0Fkya0iNiU`

Export collection
`mongoexport -h ds019664.mlab.com:19664 -d liquido-test -c ideas -u dummy  -o ideas.json`




