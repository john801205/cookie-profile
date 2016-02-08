const array = require('sdk/util/array');


var white_list = {};

function removeAllowed(first_domain, third_domain)
{
	if ( !(white_list.hasOwnProperty(first_domain)) ) {
		return false;
	}

	return array.remove(white_list[first_domain], third_domain);
}

function addAllowed(first_domain, third_domain)
{
	if ( !(white_list.hasOwnProperty(first_domain)) ) {
		white_list[first_domain] = [first_domain];
	}

	return array.add(white_list[first_domain], third_domain);
}

function checkIfAllowed(first_domain, third_domain)
{
	if ( !(white_list.hasOwnProperty(first_domain)) ) {
		white_list[first_domain] = [first_domain];
	}

	return array.has(white_list[first_domain], third_domain);
}

function getWhiteList(first_domain)
{
	if ( !(white_list.hasOwnProperty(first_domain)) ) {
		return [];
	}

	return white_list[first_domain];
}

exports.removeAllowed = removeAllowed;
exports.addAllowed = addAllowed;
exports.checkIfAllowed = checkIfAllowed;
exports.getWhiteList = getWhiteList;