const {Cc, Ci, Cu} = require('chrome');
const cookieStorage = require('./cookieStorage');
const UI = require('./ui');

var cookieObserver =
{
  observe: function(subject, topic, data)
  {
    if (topic == 'cookie-changed') {
      let cookie = subject.QueryInterface(Ci.nsICookie2);

      cookieStorage.init();
      UI.update_panel();
    }
  },

  get observerService()
  {
    return Cc["@mozilla.org/observer-service;1"].getService(Ci.nsIObserverService);
  },

  register: function()
  {
    this.observerService.addObserver(this, "cookie-changed", false);
  },

  unregister: function()
  {
    this.observerService.removeObserver(this, "cookie-changed");
  }
};

exports = module.exports = cookieObserver;
