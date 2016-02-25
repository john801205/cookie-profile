const {Cc, Ci, Cu} = require('chrome');

const utils = require('./utils');
const cookie = require('./cookie');

var httpResponseObserver =
{
  observe: function(subject, topic, data)
  {
    if ( topic == "http-on-examine-response" ||
        topic == "http-on-examine-cached-response" ||
        topic == "http-on-examine-merged-response" ) {
      let channel = subject.QueryInterface(Ci.nsIHttpChannel);

      let set_cookie_string;
      try {
        set_cookie_string = channel.getResponseHeader('Set-Cookie');
      } catch(e) {
        return;
      }

      console.info('****************************************************');
      console.info('Response', channel.requestMethod, channel.URI.spec, channel.responseStatusText);
      console.info('Set-Cookie:\n' + set_cookie_string);

      let authorized_domain = utils.getAuthorizedDomainForChannel(channel);
      let new_set_cookie_string = cookie.getSetCookieHeader(set_cookie_string, authorized_domain);
      console.info('New Set-Cookie:\n' + new_set_cookie_string);

      channel.setResponseHeader('Set-Cookie', new_set_cookie_string, false);
    }
  },

  get observerService()
  {
    return Cc["@mozilla.org/observer-service;1"].getService(Ci.nsIObserverService);
  },

  register: function()
  {
    this.observerService.addObserver(this, "http-on-examine-response", false);
    this.observerService.addObserver(this, "http-on-examine-cached-response", false);
    this.observerService.addObserver(this, "http-on-examine-merged-response", false);
  },

  unregister: function()
  {
    this.observerService.removeObserver(this, "http-on-examine-response");
    this.observerService.removeObserver(this, "http-on-examine-cached-response");
    this.observerService.removeObserver(this, "http-on-examine-merged-response");
  }
};

exports = module.exports = httpResponseObserver;
