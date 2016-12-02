'use strict';
const winston = require('winston');
const Wemo = require('wemo-client');
var wemo = new Wemo();
var logLevel = process.env.LL || 'info';

var logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({'timestamp':true, level: logLevel})
   ]
});

function getClient(callback) {
  wemo.discover(function(deviceInfo) {
    logger.debug(JSON.stringify(deviceInfo, null, 2));
    logger.info('Name: %j', deviceInfo.friendlyName);
    logger.info('host: %j', deviceInfo.host);
    logger.debug('state: %j', deviceInfo.binaryState);
  
    // Get the client for the found device
    var client = wemo.client(deviceInfo);
    callback(null, client);
  });
}
var client = null;
var argv = require('optimist')
  .usage('Turns lamp on and off.\nUsage: $0 <-o> (default is on)')
  .boolean('o')
  .argv
;
var off = argv.o;
var state = 1;

getClient(function(err, res) {  
  client = res;
  if (off === true) {
    state = 0;
  }
  client.setBinaryState(state, function(err) {
    if (err) logger.error(err), process.exit(3);
    process.exit(0);
  });
});
