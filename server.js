
var avocado = require('./lib/avocado')
var config = require('./config')
var request = require('request')
var Stream = require('pipeline-stream').Stream


function createMeetupStream(config) {
  var stream = new Stream(config)
  var once = true
  stream.onDrain = function() {
    if (!once) return
    once = false
    request({url: config.url, qs: config.qs}, function(err, res, body) {
      if (err) return stream.emit('error', err)
      stream.emit('data', body)
    })
  }
  // start the read stream
  stream.onDrain()
  return stream
}

function createThrottleStream(config) {
  var stream = new Stream(config)
  stream.write = function(data) {
    setTimeout(function() {
      stream.emit('next', data)
    }, config.delay)
  }
  return stream
}

function createJsonParseStream(config) {
  var stream = new Stream(config)
  stream.write = function(data) {
    var output = JSON.parse(data)
    if (config.field) output = output[config.field]
    stream.emit('next', output)
  }
  return stream
}

function createArrayStream(config) {
  var stream = new Stream(config)
  stream.write = function(data) {
    data.forEach(function(item) {
      stream.emit('data', item)
    })
    stream.emit('drain')
  }
  return stream
}

function createTransformStream(config) {
  var stream = new Stream(config)
  var fields = config.fields
  stream.write = function(data) {
    var output = {}
    Object.keys(fields).forEach(function(field) {
      if (!data[field]) return
      var value = data[field]
      var transform = fields[field].transform
      var outputField = fields[field].output
      output[outputField] = transform ? transform(value, output) : value 
    })
    stream.emit('next', output)
  }
  return stream
}

function createAvocadoEventStream(config) {
  var stream = new Stream(config)
  stream.write = function(data) {
    avocado.getSession(function(err, session) {
      if (err) return stream.emit('error', err)
      data.attending = session.user.id
      avocado.request({method: 'POST', path: config.api.calendarPath, json: data}, function(err, body) {
        if (err) return stream.emit('error', err)
        console.log('created event', body)
        stream.emit('drain')
      })
    })
  }
  return stream
}

createMeetupStream(config.meetup)
  // .pipe(createThrottleStream(config.throttle))
  .pipe(createJsonParseStream(config.jsonParse))
  .pipe(createArrayStream(config.array))
  .pipe(createTransformStream(config.transform))
  .pipe(createAvocadoEventStream(config.avocado))
  // .on('next', function(data) {
  //   console.log('avocado event', data)
  // })
