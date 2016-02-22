const {Cc, Ci, Cu} = require('chrome');
Cu.import("resource://gre/modules/Services.jsm");
const cookieService = Services.cookies;

const panels = require('sdk/panel');
const self = require("sdk/self");
const tabs = require("sdk/tabs");
const timers = require('sdk/timers');
const {ToggleButton} = require('sdk/ui/button/toggle');
const utils = require('./utils');
const cookieUtils = require('./cookie');
const cookieStorage = require('./cookieStorage');
const whitelist = require('./whitelist');

var panel, button, timer;

function send_cookie_to_panel(url)
{
  let domain = utils.getBaseDomain(url);
  let cookies = cookieStorage.getCookies(domain);
  let prefix = [cookieUtils.COOKIE_PREFIX, domain, ''].join(cookieUtils.COOKIE_SEPARATOR);

  panel.port.emit('cookies', prefix, domain, cookies, whitelist.getWhiteList(domain));
}

function update_panel()
{
  if (typeof timer == 'undefined') {
    timer = timers.setTimeout(function() {
      send_cookie_to_panel(tabs.activeTab.url);
      timer = undefined;
    }, 1000);
  }
}

function tracking_tab(tab)
{
  tab.on('activate', update_panel);
  tab.on('load', update_panel);
}

function tracking_all_tabs()
{

  for (let tab of tabs) {
    tracking_tab(tab);
  }

  tabs.on('open', function(tab){
    tracking_tab(tab);
  });
}

function interaction_with_panel()
{
  panel.port.on('cookie-allowed', function(first_domain, third_domain) {
    console.log('Allow', third_domain, '@', first_domain);
    whitelist.addAllowed(first_domain, third_domain);
    console.log(whitelist.getWhiteList(first_domain));
  });

  panel.port.on('cookie-disallowed', function(first_domain, third_domain) {
    console.log('Disallow', third_domain, '@', first_domain);
    whitelist.removeAllowed(first_domain, third_domain);
    console.log(whitelist.getWhiteList(first_domain));
  });
}

function init()
{
  panel = panels.Panel({
    width: 335,
    height: 409,
    contentURL: self.data.url('panel.html'),
    contentStyleFile: [self.data.url('panel.css')],
    contentScriptFile: [
      self.data.url('jquery-2.2.0.min.js'),
      self.data.url('panel.js')
    ],
    onHide: function(){
      button.state('window', {checked: false});
    }
  });

  button = ToggleButton({
    id: 'my-cookie-addon',
    label: 'my cookie addon',
    icon: {
      '16': './icon-16.png',
      '32': './icon-32.png',
      '64': './icon-64.png'
    },
    onChange: function(state) {
      if(state.checked) {
        panel.show({
          position: button
        });
      }
    }
  });

  tracking_all_tabs();
  interaction_with_panel();
}

exports.init = init;
exports.update_panel = update_panel;
