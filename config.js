var config = require('config')

config.transform = {
  name: "transform",
  fields : {
    time : {
      output : "startTime"
    },
    duration : {
      transform : function(duration, current) {
        return current.startTime + duration
      },
      output : "endTime"
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
  }
}

module.exports = config
