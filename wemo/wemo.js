#!/usr/bin/node
'use strict';
let async = require('async');
let winston = require('winston');
let Wemo = require('wemo-client');
let wemo = new Wemo();
let logLevel = process.env.LL || 'info';
const devices = {
  island: 'http://192.168.0.20:49153/setup.xml',
  lamp: 'http://192.168.0.14:49153/setup.xml',
};
const STATE = {on: 1, off:0};

let logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({'timestamp':true, level: logLevel})
   ]
});

function loadDevice(url, callback) {
  wemo.load(url, function(deviceInfo) {
    let res = wemo.client(deviceInfo);
    console.log(res);
    callback(res);
  });
}

function getDevices(callback) {
  wemo.discover(function(deviceInfo) {
    let tmp = wemo.client(deviceInfo);
    callback(tmp);
  });

}
function getClient(callback) {
  wemo.discover(function(deviceInfo) {
    logger.debug(JSON.stringify(deviceInfo, null, 2));
    logger.info('Name: %j', deviceInfo.friendlyName);
    logger.info('host: %j', deviceInfo.host);
    logger.debug('state: %j', deviceInfo.binaryState);
  
    // Get the client for the found device
    let client = wemo.client(deviceInfo);
    callback(null);
    //callback(null, client);
  });
}
let client = null;
let argv = require('optimist')
  .usage('Turns wemo on and off.\nUsage: $0 <-o> (default is on) <-i (island) || -l (lamp)>')
  .boolean('o', 'l', 'i', 'a')
  .argv
;
let off = argv.o;
let fIsland = argv.i;
let fLamp = argv.l;
let state = STATE.on;
if (off) {
  state = STATE.off;
}

let cnt = 0;

if (fLamp) {
  loadDevice(devices.lamp, function(client) {
    client.setBinaryState(state, function(err, res) {
      console.log(res);
      process.exit(0);
    });
  });
} else {
  loadDevice(devices.island, function(client) {
    client.setBinaryState(state, function(err, res) {
      console.log(res);
      process.exit(0);
    });
  });
}


/*
getDevices(function(res) {
  console.log(res);
  lDevices.push(res);
  return;
});
//console.log(lDevices.length);
/*
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
*/
