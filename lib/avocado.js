var config = require('../config').avocado
var crypto = require('crypto')
var getSession = require('async-resource').get(login)
var request = require('request')

function getUserCookieValue(headers) {
  var respCookieString = headers['set-cookie'][0];
  var cookies = {};
  respCookieString.split(';').forEach(function(cookie) {
    var name = cookie.substring(0, cookie.indexOf('='));
    var value = cookie.substring(name.length + 1, cookie.length);
    cookies[name.trim()] = (value || '').trim();
  });
  return cookies[config.api.cookieName];
}

function getHashedUserToken(cookieValue) {
  var hasher = crypto.createHash('sha256');
  hasher.update(cookieValue + config.api.key);
  return hasher.digest('hex');
}

function login(callback) {
  request.post(config.api.url + config.api.loginPath, {form : config.credentials}, function(err, res, body) {
    if (err) return callback(err)
    var cookieValue = getUserCookieValue(res.headers)
    var signature = config.api.id + ':' + getHashedUserToken(cookieValue)
    callback(null, {
      headers : {
        'Cookie': config.api.cookieName + '=' + cookieValue,
        'X-AvoSig': signature
      },
      user: JSON.parse(body).currentUser
    })
  })
}

function apiRequest(options, callback) {
  getSession(function(err, session) {
    if (err) return callback(err)
    var req = {
      method: options.method || 'GET',
      url: config.api.url + options.path,
      headers: session.headers
    }
    if (options.json) req.json = options.json
    request(req, function(err, res, body) {
      if (err) return callback(err)
      callback(null, body)
    })
  })
}

module.exports = {
  getSession : getSession,
  request : apiRequest
}

