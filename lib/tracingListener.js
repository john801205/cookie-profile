const {Cc, Ci, Cu} = require('chrome');
const self = require("sdk/self");
const utils = require('./utils');

const CONTENT_TYPES = ["text/html"];

let cookiejs_text = self.data.load('../lib/cookie.js');

// Helper function for XPCOM instanciation
function CCIN(cName, ifaceName) {
  return Cc[cName].createInstance(Ci[ifaceName]);
}

function inject_script(data, domain)
{
  let script = "<script type='text/javascript'>";
  script += "var domain = '" + domain + "';";
  script += cookiejs_text;
  script += "cookie_hook();";
  script += "</script>";


  if (/(<meta[^>]*>)/i) {
    data = data.replace(/(<meta[^>]*>)/i, "$1" + script);
  } else if (/(<head[^>]*>)/i.test(data)){
    data = data.replace(/(<head[^>]*>)/i, "$1" + script);
  } else if(/(<script[^>]*>)/i.test(data)) {
    data = data.replace(/(<script[^>]*>)/i, script + "$1");
  } else {
  }

  return data;
}

function TracingListener(authorized_domain)
{
  this.authorized_domain = authorized_domain;
  this.originalListener = null;
  this.receivedData = [];
}

TracingListener.prototype =
{
  onDataAvailable: function(request, context, inputStream, offset, count)
  {
    let binaryInputStream = CCIN("@mozilla.org/binaryinputstream;1", "nsIBinaryInputStream");
    binaryInputStream.setInputStream(inputStream);

    let data = binaryInputStream.readBytes(count);
    this.receivedData.push(data);
  },

  onStartRequest: function(request, context)
  {
    this.originalListener.onStartRequest(request, context);
  },

  onStopRequest: function(request, context, statusCode)
  {
    let data = this.receivedData.join("");
    let new_data = inject_script(data, this.authorized_domain);
    this.receivedData = null;

    let storageStream = CCIN("@mozilla.org/storagestream;1", "nsIStorageStream");
    storageStream.init(8192, new_data.length);
    if (new_data.length > 0){
      try {
        let outputStream = storageStream.getOutputStream(0);
        outputStream.write(new_data, new_data.length);
        outputStream.close();

        this.originalListener.onDataAvailable(request, context, storageStream.newInputStream(0), 0, new_data.length);
      } catch(e) {
        Cu.reportError(e);
      }
    }

    this.originalListener.onStopRequest(request, context, statusCode);

    // request.QueryInterface(Ci.nsIRequest);
    // console.log(request.name, this.parent_domain);
    // console.log('++++++++++++++++++++++++++++++++++++++++++++++++++++');
  }
};

var httpResponseObserver =
{
  observe: function(subject, topic, data)
  {
    if ( topic == "http-on-examine-response" ) {
      let channel = subject.QueryInterface(Ci.nsIHttpChannel);
      if (channel.responseStatus >= 300 && channel.responseStatus < 400 && channel.responseStatus != 304) // Redirect status
        return;

      if (!this.isObservedType(channel))
        return;

      let domain = utils.getAuthorizedDomainForChannel(channel);

      let new_listener = new TracingListener(domain);

      subject.QueryInterface(Ci.nsITraceableChannel);
      new_listener.originalListener = subject.setNewListener(new_listener);
    }
  },


  isObservedType: function(channel)
  {
    let content_type;
    try {
      content_type = channel.getResponseHeader("Content-Type");
    } catch(e) {
      return true;
    }

    for (let i = 0; i < CONTENT_TYPES.length; i++) {
      if (content_type.indexOf(CONTENT_TYPES[i]) !== -1) {
        // console.log('True', channel.URI.spec, content_type);
        return true;
      }
    }

    // console.log('False', channel.URI.spec, content_type);
    return false;
  },

  get observerService()
  {
    return Cc["@mozilla.org/observer-service;1"].getService(Ci.nsIObserverService);
  },

  register: function()
  {
    this.observerService.addObserver(this, "http-on-examine-response", false);
  },

  unregister: function()
  {
    this.observerService.removeObserver(this, "http-on-examine-response");
  }
};

exports = module.exports = httpResponseObserver;
