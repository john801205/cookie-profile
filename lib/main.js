const self = require("sdk/self");

const httpRequestObserver = require('./httpRequestObserver');
const httpResponseObserver = require('./httpResponseObserver');
const TracingListener = require('./tracingListener');
const UI = require('./ui');

function enable()
{
	// httpRequestObserver.register();
	// httpResponseObserver.register();
	// TracingListener.register();
	// UI.init();
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