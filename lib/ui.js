const {Cc, Ci, Cu} = require('chrome');
Cu.import("resource://gre/modules/Services.jsm");
const cookieService = Services.cookies;

const panels = require('sdk/panel');
const self = require("sdk/self");
const tabs = require("sdk/tabs");
const {ToggleButton} = require('sdk/ui/button/toggle');
const utils = require('./utils');
const cookieUtils = require('./cookie');
const whitelist = require('./whitelist');


function send_cookie_to_panel(panel, url)
{
	let cookies = [];
	let domain = utils.getBaseDomain(url);
	let prefix = [cookieUtils.COOKIE_PREFIX, domain, ''].join(cookieUtils.COOKIE_SEPARATOR);

	let cookie_enum = cookieService.enumerator;
	while (cookie_enum.hasMoreElements()) {
		let cookie = cookie_enum.getNext().QueryInterface(Ci.nsICookie2);
		if (cookie.name.startsWith(prefix)) {
			cookies.push(cookie);
		}
	}

	panel.port.emit('cookies', prefix, domain, cookies, whitelist.getWhiteList(domain));
}

function tracking_tab(tab, panel)
{
	tab.on('activate', function(){
		send_cookie_to_panel(panel, tab.url);
	});

	tab.on('load', function(){
		send_cookie_to_panel(panel, tab.url);
	});
}

function tracking_all_tabs(panel)
{

	for (let tab of tabs) {
		tracking_tab(tab, panel);
	}

	tabs.on('open', function(tab){
		tracking_tab(tab, panel);
	});
}

function interaction_with_panel(panel)
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
	let panel = panels.Panel({
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

	let button = ToggleButton({
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

	tracking_all_tabs(panel);
	interaction_with_panel(panel);
}

exports.init = init;