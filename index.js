module.exports = {
  handlers : {
    clear    : require('./lib/handlers/clear'),
    deposit  : require('./lib/handlers/deposit'),
    sweep    : require('./lib/handlers/sweep'),
    toledger : require('./lib/handlers/toledger')
  }
}
