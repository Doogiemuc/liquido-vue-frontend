// see http://vuejs-templates.github.io/webpack for documentation.
var path = require('path')

module.exports = {
  build: {
    env: require('./prod.env'),
    index: path.resolve(__dirname, '../dist/index.html'),
    assetsRoot: path.resolve(__dirname, '../dist'),
    assetsSubDirectory: 'static',
    assetsPublicPath: '/',
    productionSourceMap: true,
    // Gzip off by default as many popular static hosts such as
    // Surge or Netlify already gzip all static assets for you.
    // Before setting to `true`, make sure to:
    // npm install --save-dev compression-webpack-plugin
    productionGzip: false,
    productionGzipExtensions: ['js', 'css']
  },
  dev: {
    env: require('./dev.env'),
    port: 3001,
    assetsSubDirectory: 'static',
    assetsPublicPath: '/',
    proxyTable: {
			/*
			// proxy all requests starting with /liquido/v2 to AWS EC2 server 
      '/liquido/v2': {
        target: 'http://ec2-34-242-101-191.eu-west-1.compute.amazonaws.com',
        changeOrigin: true,
        //pathRewrite: {
        //  '^/api': ''
        //}
				//router: {
				//	'localhost:3001' : 'http://ec2-34-242-101-191.eu-west-1.compute.amazonaws.com:80'
				//}
			}
			*/
		},
    // CSS Sourcemaps off by default because relative paths are "buggy"
    // with this option, according to the CSS-Loader README
    // (https://github.com/webpack/css-loader#sourcemaps)
    // In our experience, they generally work as expected,
    // just be aware of this issue when enabling this option.
    cssSourceMap: false
  }
}
