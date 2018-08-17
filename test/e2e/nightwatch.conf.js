// http://nightwatchjs.org/guide#settings-file

var port = process.env.PORT || 3001
console.log("nightwatchjs.conf.js port="+port)

module.exports = {
  "src_folders": ["test/e2e/specs"],
  "output_folder": "test/e2e/reports",
  "custom_assertions_path": ["test/e2e/custom-assertions"],
  "custom_commands_path" : "test/e2e/custom-commands",

  "selenium": {
    "start_process": true,
    "server_path": "node_modules/selenium-server/lib/runner/selenium-server-standalone-2.53.1.jar",
    "host": "127.0.0.1",
    "port": 4444,
    "log_path" : "test/e2e/logs",   //save logs to file after run
    "cli_args": {
      "webdriver.chrome.driver": require('chromedriver').path
    }
  },

  "test_settings": {
    "default": {
      "launch_url" : "http://testuser1%40liquido.de:dummyPasswordHash@localhost:"+port,
      "selenium_port": 4444,
      "selenium_host": "localhost",
      "silent": true,
      "globals" : {
        "user1" : "testuser@liquido.de",
        "pass"  : "dummyPasswordHash",
        "appendToLog" : {
          "log2File" : "test/e2e/logs/chrome_console.log",
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
          "binary": "C:\\Program Files (x86)\\SRWare Iron\\chrome.exe"
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
