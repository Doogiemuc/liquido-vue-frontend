// Nightwatch configuration that runs against a given host:port
// This can be used to directly E2E test your prod deployment.
// No dev-server will be started (as in test/e2e/runner.js)
//
// See http://nightwatchjs.org/guide#settings-file   for infos about this file
//

// var webapp = "https://testuser1%40liquido.de:dummyPasswordHash@liquido-vue-frontend-doogiemuc.c9users.io:443"
var webapp = "http://testuser1%40liquido.de:dummyPasswordHash@localhost:3001"
var backend = "http://localhost:8080/liquido/v2"
console.log("Nightwatchjs is testing liquido\nwebapp: "+webapp+"\nbackend: "+backend)

module.exports = {
  "src_folders": ["test/e2e_prod/specs"],
  "output_folder": "test/e2e_prod/reports",
  "custom_assertions_path": ["test/e2e_prod/custom-assertions"],
  "custom_commands_path" : "test/e2e_prod/custom-commands",

  "selenium": {
    "start_process": true,
    "server_path": "node_modules/selenium-server/lib/runner/selenium-server-standalone-2.53.1.jar",
    "host": "127.0.0.1",
    "port": 4444,
    "log_path" : "test/e2e_prod/logs",   //save logs to file after run
    "cli_args": {
      "webdriver.chrome.driver": require('chromedriver').path
    }
  },

  "test_settings": {
    "default": {
      "launch_url" : webapp,
      "selenium_port": 4444,
      "selenium_host": "localhost",
      "silent": true,
      "globals" : {
        "user1"   : "testuser1@liquido.de",
        "pass1"   : "dummyPasswordHash",
				"webapp"  : webapp,
				"backend" : backend,
        "appendToLog" : {
          "log2File" : "test/e2e_prod/logs/chrome_console.log",
          "log2Console" : true,
          "logTestNames" : true
        }
      }
    },

    "chrome": {
      "desiredCapabilities": {
        "browserName": "chrome",
        "javascriptEnabled": true,
        "acceptSslCerts": true,
        "loggingPrefs": { "browser": "ALL" },    // needed to capture logs https://groups.google.com/forum/#!topic/nightwatchjs/KWdF37qE038
        "chromeOptions": {
					 "args": [
             "--user-agent=Headless",
             "--window-size=1024,768"
        ]
        //  "binary": "C:\\Program Files (x86)\\SRWare Iron\\chrome.exe"
        }
      }
    },

    "firefox": {
      "desiredCapabilities": {
        "browserName": "firefox",
        "javascriptEnabled": true,
        "acceptSslCerts": true
      }
    }
  }
}
