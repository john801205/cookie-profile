const {Cc, Ci, Cu} = require('chrome');
Cu.import("resource://gre/modules/Services.jsm");
const cookieService = Services.cookies;

const arrayUtil = require('sdk/util/array');
const timers = require('sdk/timers');
const cookieUtil = require('./cookie');
const whitelist = require('./whitelist');

function cookieStorage()
{
  this.cookies = {};
  this.timer = undefined;
}

cookieStorage.prototype =
{
  init: function()
  {
    if (typeof this.timers !== 'undefined')
      return;

    let _this = this;
    this.timer = timers.setTimeout(function() {
      _this.reload();
      _this.timer = undefined;
    }, 500);
  },

  reload: function()
  {
    for (let domain in this.cookies) {
      if (this.cookies.hasOwnProperty(domain))
        delete this.cookies[domain];
    }

    let cookie_enum = cookieService.enumerator;
    while (cookie_enum.hasMoreElements()) {
      let cookie = cookie_enum.getNext().QueryInterface(Ci.nsICookie2);
      this.add(cookie);
    }
  },

  add: function(cookie)
  {
    if (!cookie.name.startsWith(cookieUtil.COOKIE_PREFIX))
      return;

    let domain = cookie.name.split(cookieUtil.COOKIE_SEPARATOR)[1];
    if (!this.cookies.hasOwnProperty(domain))
      this.cookies[domain] = [];
    if (cookie.rawHost.endsWith(domain))
      whitelist.addAllowed(domain, cookie.rawHost);

    arrayUtil.add(this.cookies[domain], cookie);
  },

  change: function(cookie)
  {
    if (!cookie.name.startsWith(cookieUtil.COOKIE_PREFIX))
      return;

    let domain = cookie.name.split(cookieUtil.COOKIE_SEPARATOR)[1];
    if (!this.cookies.hasOwnProperty(domain))
      return;

    for (let i = 0; i < this.cookies[domain].length; i++) {
      let c = this.cookies[domain][i];

      if (c.name != cookie.name)
        continue;

      this.cookies[domain][i] = cookie;
    }
  },

  remove: function(cookie)
  {
    if (!cookie.name.startsWith(cookieUtil.COOKIE_PREFIX))
      return;

    let domain = cookie.name.split(cookieUtil.COOKIE_SEPARATOR)[1];
    if (!this.cookies.hasOwnProperty(domain))
      return;

    for (let i = 0; i < this.cookies[domain].length; i++) {
      let c = this.cookies[domain][i];

      if (c.name != cookie.name)
        continue;

      arrayUtil.remove(this.cookies[domain], cookie);
    }
  },

  getCookies: function(domain)
  {
    if (this.cookies.hasOwnProperty(domain)) {
      return this.cookies[domain];
    } else {
      return [];
    }
  }
};

exports = module.exports = new cookieStorage();
