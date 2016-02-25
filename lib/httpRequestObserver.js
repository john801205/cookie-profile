const {Cc, Ci} = require('chrome');
const utils = require('./utils');
const cookie = require('./cookie');

var httpRequestObserver =
{
  observe: function(subject, topic, data)
  {
    if (topic == "http-on-modify-request") {
      let channel = subject.QueryInterface(Ci.nsIHttpChannel);

      let cookie_string;
      try {
        cookie_string = channel.getRequestHeader('Cookie');
      } catch(e) {
        return;
      }
      console.info('====================================================');
      console.info('Request', channel.requestMethod, channel.URI.spec);
      console.info('Cookie:\n' + cookie_string);

      let authorized_domain = utils.getAuthorizedDomainForChannel(channel);
      let new_cookie_string = cookie.getCookieHeader(cookie_string, authorized_domain);
      console.info('Authorized domain:', authorized_domain);
      console.info('New Cookie:\n' + new_cookie_string);

      channel.setRequestHeader('Cookie', new_cookie_string, false);
    }
  },

  get observerService()
  {
    return Cc["@mozilla.org/observer-service;1"].getService(Ci.nsIObserverService);
  },

  register: function()
  {
    this.observerService.addObserver(this, "http-on-modify-request", false);
  },

  unregister: function()
  {
    this.observerService.removeObserver(this, "http-on-modify-request");
  }
};

exports = module.exports = httpRequestObserver;
