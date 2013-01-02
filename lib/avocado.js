var config = require('../config').avocado.api
var crypto = require('crypto')
var getResource = require('async-resource').get
var request = require('request')

function getUserCookieValue(headers) {
  var respCookieString = headers['set-cookie'][0];
  var cookies = {};
  respCookieString.split(';').forEach(function(cookie) {
    var name = cookie.substring(0, cookie.indexOf('='));
    var value = cookie.substring(name.length + 1, cookie.length);
    cookies[name.trim()] = (value || '').trim();
  });
  return cookies[config.cookieName];
}

function getHashedUserToken(cookieValue) {
  var hasher = crypto.createHash('sha256');
  hasher.update(cookieValue + config.key);
  return hasher.digest('hex');
}

function login(credentials, callback) {
  request.post(config.url + config.loginPath, {form : credentials}, function(err, res, body) {
    if (err) return callback(err)
    var cookieValue = getUserCookieValue(res.headers)
    var signature = config.id + ':' + getHashedUserToken(cookieValue)
    callback(null, {
      headers : {
        'Cookie': config.cookieName + '=' + cookieValue,
        'X-AvoSig': signature
      },
      user: JSON.parse(body).currentUser
    })
  })
}

function apiRequest(getSession, options, callback) {
  getSession(function(err, session) {
    if (err) return callback(err)
    var req = {
      method: options.method || 'GET',
      url: config.url + options.path,
      headers: session.headers
    }
    if (options.json) req.json = options.json
    request(req, function(err, res, body) {
      if (err) return callback(err)
      callback(null, body)
    })
  })
}

module.exports = function(credentials) {
  var getSession = getResource(login.bind(null, credentials))
  return {
    getSession : getSession,
    request : apiRequest.bind(null, getSession)
  }
}

