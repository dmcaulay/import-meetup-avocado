var config = require('config')
var EventEmitter = require('events').EventEmitter

var debug = new EventEmitter()
debug.on('data', function(data, meta, flow) {
  console.log(flow, data)
})

config.debug = debug

config.transform = {
  name: "transform",
  fields : {
    time : {
      output : "start"
    },
    duration : {
      transform : function(duration, current) {
        return current.start + duration
      },
      output : "end"
    },
    name : {
      output : "title"
    },
    venue : {
      transform : function(venue) {
        return venue.name + ', ' + venue.city + ', ' + venue.state
      },
      output: "location"
    },
    event_url : {
      output: "description"
    }
  },
  debug: debug
}

module.exports = config
