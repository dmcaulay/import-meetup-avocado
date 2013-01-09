
var avocado = require('./lib/avocado')
var config = require('./config')
var request = require('request')
var streams = require('pipeline-stream')
var Stream = streams.Stream
var _ = require('underscore')

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

function createAvocadoEventStream(config) {
  var stream = new Stream(config)
  var client = avocado(config.credentials)
  stream.write = function(data) {
    client.getSession(function(err, session) {
      if (err) return stream.emit('error', err)
      data.attending = session.user.id
      client.request({method: 'POST', path: config.api.calendarPath, json: data}, function(err, body) {
        if (err) return stream.emit('error', err)
        console.log('created event', body)
        stream.emit('drain')
      })
    })
  }
  return stream
}

createMeetupStream(config.meetup)
  .pipe(new streams.Parser(config.jsonParse))
  .pipe(new streams.Pick((config.meetupResults)))
  .pipe(new streams.Array(config.array))
  .pipe(new streams.Transform(config.transform))
  .pipe(createAvocadoEventStream(config.avocado))
  // .on('next', function(data) {
  //   console.log('avocado event', data)
  // })

