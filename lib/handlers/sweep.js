module.exports = handler

var debug    = require('debug')('qpm_deposit:sweep')
var fs       = require('fs')
var http     = require('http')
var hdwallet = require('qpm_hdwallet')
var qpm_ui   = require('qpm_ui')
var wc_db    = require('wc_db')
var wc       = require('webcredits')


function handler(req, res) {

  var origin = req.headers.origin
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin)
  }

  var defaultCurrency = res.locals.config.currency || 'https://w3id.org/cc#bit'

  var source      = req.body.source
  var destination = req.body.destination
  var currency    = req.body.currency || defaultCurrency
  var amount      = req.body.amount
  var timestamp   = null
  var description = req.body.description
  var context     = req.body.context


  var source      = req.session.userId

  if (!req.session.userId) {
    res.send('must be authenticated')
    return
  }


  var config = res.locals.config
  var sequelize = wc_db.getConnection(config.db)

  var address = config.HDPublicKey || 'xpub661MyMwAqRbcH4Jage4yavGhxdhv48gniC2S4irQG3Rj78t9pbTQch3PpqKvwunq7cuYeLEQ6VA1C3wcyk8MKspGqAtU9agfNcn2KBDvM6U'

  var dep = hdwallet.webidAndPubKeyToAddress(source, address, true)
  var depURI = 'bitcoin:' + dep
  var swept = 0

  http.get('http://tbtc.blockr.io/api/v1/address/balance/' + dep, function(json){
      var body = ''

      json.on('data', function(chunk){
          body += chunk
      })

      json.on('end', function(){
          var j = JSON.parse(body)
          var bal = 0
          if (j && j.data && j.data.balance) {
            bal = j.data.balance
          }
          console.log("Address balance: ", bal)


          wc.getSpent(depURI, sequelize, config, function(err, swept) {
            if (err) {
              console.log('error')
            } else {





              wc.getDeposit(depURI, sequelize, config, function(err, cleared) {

                if (err) {
                  console.log('error')
                } else {

                  var credit = {}

                  var unswept = cleared - (swept || 0)


                  if (unswept === 0) {

                    res.status(200)
                    res.header('Content-Type', 'text/html')

                    res.render('pages/sweep_error', { ui : config.ui })


                    return

                  }

                  credit["https://w3id.org/cc#source"] = depURI
                  credit["https://w3id.org/cc#amount"] = unswept
                  credit["https://w3id.org/cc#currency"] = 'https://w3id.org/cc#bit'
                  credit["https://w3id.org/cc#destination"] = source

                  wc.insert(credit, sequelize, config, function(err, val) {
                    if (err) {
                    } else {

                      res.status(200)
                      res.header('Content-Type', 'text/html')

                      res.render('pages/sweep_success', { ui : config.ui })


                    }
                  })


                }


              })









            }
          })




      })
  }).on('error', function(e){
        console.log("Got an error: ", e)
  })



}
