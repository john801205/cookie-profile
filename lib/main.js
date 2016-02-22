const self = require("sdk/self");

const httpRequestObserver = require('./httpRequestObserver');
const httpResponseObserver = require('./httpResponseObserver');
const TracingListener = require('./tracingListener');
const cookieObserver = require('./cookieObserver');
const cookieStorage = require('./cookieStorage');
const UI = require('./ui');

function enable()
{
  cookieStorage.init();
  httpRequestObserver.register();
  httpResponseObserver.register();
  TracingListener.register();
  cookieObserver.register();
  UI.init();
}

function main(options)
{
  enable();
  console.log("Started Up!");

  // TODO: If this is the first run after install, display an informative page
  if (options) {

  }
}


exports.main = main;
