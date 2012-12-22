var config = require('config').avocado
var avocado = require('../../lib/avocado')(config.credentials)

describe('avocado', function() {
  it('makes avocado requests', function(done) {
    avocado.request({path: config.api.calendarPath}, function(err, body) {
      console.log('err',err)
      console.log('body',body)
      done()
    })
  })
})
