const {Cc, Ci, Cu} = require('chrome');
const eTLDService = Cc["@mozilla.org/network/effective-tld-service;1"].getService(Ci.nsIEffectiveTLDService);
const ioService = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);
const uRIFixup = Cc["@mozilla.org/docshell/urifixup;1"].createInstance(Ci.nsIURIFixup);
const whitelist = require('./whitelist');

function getBaseDomain(url)
{
  try {
    let aURI = uRIFixup.createFixupURI(url, uRIFixup.FIXUP_FLAG_NONE);
    return eTLDService.getBaseDomain(aURI);
  } catch(e) {
    return null;
  }
}

function getParentDomainForChannel(channel)
{
  let parent_window, parent_url, parent_domain;

  parent_window = getParentWindowForChannel(channel);
  if (parent_window)
    parent_url = parent_window.location.href;
  else
    parent_url = channel.URI.spec;

  parent_domain = getBaseDomain(parent_url);
  if (!parent_domain)
    parent_domain = getBaseDomain(channel.URI.spec);

  // console.info('From:', parent_url);
  // console.info('From base domain:', parent_domain);

  return parent_domain;
}

function getAuthorizedDomainForChannel(channel)
{
  let first_domain = getParentDomainForChannel(channel);
  let third_domain = getBaseDomain(channel.URI.spec);
  
  if (whitelist.checkIfAllowed(first_domain, third_domain))
    return third_domain;
  else
    return first_domain;
}

/**
 * Tries to get the window associated with a channel. If it cannot, returns
 * null and logs an explanation to the console. This is not necessarily an
 * error, as many internal requests are not associated with a window, e.g. OCSP
 * or Safe Browsing requests.
 * https://github.com/EFForg/privacybadgerfirefox/blob/master/lib/utils.js
 */

function getWindowForChannel (channel)
{
  let nc;
  try {
    nc = channel.notificationCallbacks ? channel.notificationCallbacks : channel.loadGroup.notificationCallbacks;
  } catch(e) {
    console.log("ERROR missing loadgroup notificationCallbacks for " + channel.URI.spec);
    return null;
  }
  if (!nc) {
    console.log("ERROR no loadgroup notificationCallbacks for " + channel.URI.spec);
    return null;
  }

  let loadContext;
  try {
    loadContext = nc.getInterface(Ci.nsILoadContext);
  } catch(ex) {
    try {
      loadContext = channel.loadGroup.notificationCallbacks
        .getInterface(Ci.nsILoadContext);
    } catch(ex) {
      console.log("ERROR missing loadcontext", channel.URI.spec, ex.name);
      return null;
    }
  }

  let contentWindow;
  try {
    contentWindow = loadContext.associatedWindow;
  } catch(ex) {
    //console.log("ERROR missing contentWindow", channel.URI.spec, ex.name);
  }

  return contentWindow;

}

function getParentWindowForChannel (channel)
{
  let win = getWindowForChannel(channel);
  if (win) {
    if (win.frameElement) {
      return win.parent;
    } else {
      return win.top;
    }
  }

  return null;
}

exports.getBaseDomain = getBaseDomain;
exports.getParentDomainForChannel = getParentDomainForChannel;
exports.getParentWindowForChannel = getParentWindowForChannel;
exports.getAuthorizedDomainForChannel = getAuthorizedDomainForChannel;
