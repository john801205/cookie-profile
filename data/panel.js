

function display_cookie_information()
{
  let string = 'Name: ' + $(this).attr('name') + '<br>';
  string += 'Content: ' + $(this).attr('content') + '<br>';
  string += 'Domain: ' + $(this).attr('domain') + '<br>';
  string += 'Path: ' + $(this).attr('path') + '<br>';
  string += 'Expires: ' + $(this).attr('expires') + '<br>';

  $('#content').html(string);
}

function bind_click_event(first_domain)
{
  $('#toggle-view-list .title').click(function () {
    let panel = $(this).parent().children('.panel');

    if (panel.is(':hidden')) {
      let target_id = $(this).attr('target');
      let target = $('#toggle-view-panel #'+target_id).first().clone().get(0);

      panel.html(target);
      panel.on('click', '.cookie', display_cookie_information);

      panel.slideDown();
      $(this).children('span').html('-');
    } else {
      panel.slideUp();
      panel.html('');

      $('#content').html('');
      $(this).children('span').html('+');
    }
  });

  $('.controller').click(function(){
    let third_domain = $(this).siblings('.title').children('h3').html();
    if ($(this).html() == 'X'){
      self.port.emit('cookie-allowed', first_domain, third_domain);
      $(this).html('O');
    } else {
      self.port.emit('cookie-disallowed', first_domain, third_domain);
      $(this).html('X');
    }
  });
}

function check_in_whitelist(whitelist, domain)
{
  // console.log(whitelist, domain);
  let index = whitelist.indexOf(domain);
  if (index < 0)
    return 'X';
  else
    return 'O';
}

function generate_cookie_html(prefix, cookies, whitelist)
{
  let domains = {};
  for (let cookie of cookies){
    if (!(cookie.rawHost in domains))
      domains[cookie.rawHost] = [];

    domains[cookie.rawHost].push(cookie);
  }

  let list = '<div id="toggle-view-list"><ul>';
  let panel = '<div id="toggle-view-panel">';
  for (let domain of Object.keys(domains)) {
    list += '<li><div class="title" target="' + domain.replace(/\./g, '-') + '">';
    list += '<span>+</span><h3>' + domain + '</h3></div>';
    list += '<div class="controller">' + check_in_whitelist(whitelist, domain); 
    list += '</div><div class="panel"></div></li>';

    panel += '<div id="' + domain.replace(/\./g, '-') + '"><ul>';
    for(let cookie of domains[domain]) {
      // console.log(cookie);
      let expires = new Date(cookie.expires * 1000);

      panel += '<li class="cookie" ';
      panel += 'name="' + cookie.name.replace(prefix, '') +'" ';
      panel += 'content="' + cookie.value +'" ';
      panel += 'domain="' + cookie.host + '" ';
      panel += 'path="' + cookie.path + '" ';
      panel += 'expires="' + expires.toLocaleString() + '">';

      panel += cookie.name.replace(prefix, '');
      panel += '</li>';
    }
    panel += '</ul></div>';
  }
  list += '</ul></div>';
  panel += '</div>';

  $('#list').html(list + panel);
}

self.port.on('cookies', function(prefix, domain, cookies, whitelist) {
  generate_cookie_html(prefix, cookies, whitelist);
  bind_click_event(domain);
  $('#content').html('');
});
