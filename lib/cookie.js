var COOKIE_PREFIX = 'mycookieaddon';
var COOKIE_SEPARATOR = ':::|:::::|:::';

function isNonEmptyString(str)
{
  return typeof str == 'string' && !!str.trim();
}

function getSetCookieHeader(set_cookies, domain)
{
  let original_set_cookies = set_cookies.split('\n');
  let new_set_cookies = original_set_cookies
    .filter(isNonEmptyString)
    .map(function(set_cookie){
      set_cookie = set_cookie.trim();
      return [COOKIE_PREFIX, domain, set_cookie].join(COOKIE_SEPARATOR);
    });

  return new_set_cookies.join('\n');
}

function getCookieHeader(cookies, domain)
{
  let original_cookies = cookies.split(';');
  let prefix = [COOKIE_PREFIX, domain, ''].join(COOKIE_SEPARATOR);

  let new_cookies = original_cookies
    .filter(isNonEmptyString)
    .filter(function(cookie) {
      cookie = cookie.trim();
      if (cookie.startsWith(prefix))
        return true;
      else
        return false;
    }).map(function(cookie) {
      return cookie.replace(prefix, '').trim();
    });

  return new_cookies.join('; ');
}

function cookie_hook()
{
  let cookie_getter = document.__lookupGetter__('cookie');
  let cookie_setter = document.__lookupSetter__('cookie');

  document.__defineGetter__('cookie', function() {
    let original_cookies = cookie_getter.apply(document);
    let new_cookies = getCookieHeader(original_cookies, domain);
    console.log('GET\n' + original_cookies + '\n' + new_cookies);
    return new_cookies;
  });
  document.__defineSetter__('cookie', function(original_set_cookies) {
    let new_set_cookies = getSetCookieHeader(original_set_cookies, domain);
    console.log('SET\n' + original_set_cookies + '\n' + new_set_cookies);
    return cookie_setter.apply(document, [new_set_cookies]);
  });
}



if (typeof exports !== 'undefined'){
  exports.getSetCookieHeader = getSetCookieHeader;
  exports.getCookieHeader = getCookieHeader;
  exports.COOKIE_PREFIX = COOKIE_PREFIX;
  exports.COOKIE_SEPARATOR = COOKIE_SEPARATOR;
}
