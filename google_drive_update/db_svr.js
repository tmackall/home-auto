"use strict";
const path = require('path');
const fs = require('fs');
const async = require('async');
const clone = require('clone');
const archiver =  require('archiver');
const nodemailer = require('nodemailer');
const http = require('http');
const camLib = require('../lib/cam_lib');
const recursive = require('recursive-readdir');
const winston = require('winston');
const site = require('../conf.d/site');
const ObjectId = require('mongodb').ObjectId;

var exports = module.exports = {};


// --------------------
// logger
// --------------------
var logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({'timestamp':true, level: site.LL})
   ]
});

// --------------------
// ip address - get it
// --------------------
var hostname = null;
camLib.ipGet(function(res) {
  hostname = res;
});

//
// db globals
const DB = 'mongodb://' + hostname + ':27017/' + site.DB_NAME;
logger.info(DB);

var MongoClient = require('mongodb').MongoClient,
  test = require('assert');

      
// ----------------------------------------
// getAllUnprocessed() - get all the unprocessed
// db movement entries.
// ----------------------------------------
function getAllUnprocessed(fUpdate, callback) {
  if (typeof callback === 'undefined') {
    callback = fUpdate;
    fUpdate = false;
  }

  MongoClient.connect(DB, function(err, db) {
    db.collection(site.DB_COLLECTION).find({
      processed: fUpdate
    }).toArray(function(err, res){
      db.close();
      callback(err, res);
    });
  });
}

// ----------------------------------------
//
// db - insert movement document
//
// ----------------------------------------
function insertMovementDoc(callback) {
  // Insert a single document
  MongoClient.connect(DB, function(err, db) {
    db.collection(site.DB_COLLECTION).insertOne({
      movement_date: new Date(),
      processed: false},
      function(err, res){
        db.close();
        callback(err);
    });
  });
}

// ----------------------------------------
//
// db - update movement document
//
// ----------------------------------------
function updateMovementDoc(lMovement, value, callback) {
  if (typeof callback === 'undefined') {
    callback = value;
    value = true;
  }

  var oid = null;
  MongoClient.connect(DB, function(err, db) {
    async.forEachSeries(lMovement, function(rec, callb) {
      logger.debug('update: ' + rec._id);
      oid = new ObjectId(rec._id);
      db.collection(site.DB_COLLECTION).update({
        _id: oid},
        { $set:{processed: value}},
        function(err, res){
          logger.debug(res);
          callb(err);
      });
    }, function(err) {
      db.close();
      callback(err);
    });
  });
}

// ----------------------------
//
// web app - create the db service
//
// ----------------------------
var server = http.createServer(requestProcess);

function requestProcess(request, response) {
  var headers = request.headers;
  var method = request.method;
  var url = request.url;
  var body = [];
  var valRet = {};
  var data = null;

  response.statusCode = 200;
  request.on('error', function(err) {
    logger.error(err);
    valRet.text = err;
  }).on('data', function(chunk) {
    body.push(chunk);
  }).on('end', function() {
    body = Buffer.concat(body);
    response.on('error', function(err) {
      logger.error(err);
      valRet.text = err;
    });
    var tmpReq = 'Message received: ' + url;

    
    // response - put it together and it needs to be synced
    async.series([
      function(cb) {
        
        // movement - store the activity in the
        // database
        if (url === '/db/movement' &&  method == 'POST') {
          logger.debug('Storing movement info');
          insertMovementDoc(function(err) {
            if (err) {
              logger.error(err);
              response.statusCode = 400;
              cb(err);
            } else {
              response.statusCode = 201;
              cb();
            }
          });
        } else if (url === '/db/unprocessed' &&  method == 'GET') {
          logger.debug('Get the unprocessed DB entries');
          getAllUnprocessed(function(err, res){
            if (err) {
              response.statusCode = 400;
            } else {
              valRet.query = res;
            }
            cb();
          });
        } else if (url === '/db/unprocessed' &&  method == 'PUT') {
          logger.debug('Update DB entries - unprocessed');
          data = JSON.parse(body);
          updateMovementDoc(data, false, function(err) {
            logger.debug('update status: ' + err);
            cb(err);
          });
        } else if (url === '/db/processed' &&  method == 'GET') {
          logger.debug('Get the processed DB entries');
          getAllUnprocessed(true, function(err, res){
            if (err) {
              response.statusCode = 400;
            } else {
              valRet.query = res;
            }
            cb();
          });
        } else if (url === '/db/processed' &&  method == 'PUT') {
          logger.debug('Update DB entries - processed');
          data = JSON.parse(body);
          updateMovementDoc(data, function(err) {
            logger.debug('update status: ' + err);
            cb(err);
          });
    
        } else {
          logger.warn('Unrecognized request: %s', tmpReq);
          response.statusCode = 404;
          cb();
        }
      },
      function(cb) {
        
        // response - send it
        response.setHeader('Content-Type', 'application/json');
        valRet.status = response.statusCode;
    
        var responseBody = {
          method: method,
          data: valRet,
          url: url,
        };
    
        response.write(JSON.stringify(responseBody));
        response.end();
      },
    ]);
  });
}

// ------------------------------------
//  main loop - service
// ------------------------------------
server.listen(site.PORT_DB, hostname);
