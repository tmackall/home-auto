// Copyright 2012-2016, Google, Inc.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use strict';

var readline = require('readline');

//var google = require('../lib/googleapis.js');
var google = require('googleapis');
var OAuth2Client = google.auth.OAuth2;
var drive = google.drive('v3');

// Client ID and client secret are available at
// https://code.google.com/apis/console
var CLIENT_ID = '136694865106-meov8uvcocp0a60h4gsgb89oksf8lfn8.apps.googleusercontent.com';
var CLIENT_SECRET = 'PlYesT4AfrO0Yr-iq-VkyeVe';
var REDIRECT_URL = 'http://tmackall.com/oauth2callback/';

var oauth2Client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URL);

var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function getAccessToken (oauth2Client, callback) {
  // generate consent page url
  var url = oauth2Client.generateAuthUrl({
    access_type: 'offline', // will return a refresh token
    //scope: 'https://www.googleapis.com/auth/drive.me' // can be a space-delimited string or an array of scopes
    scope: 'https://www.googleapis.com/auth/drive' // can be a space-delimited string or an array of scopes
  });

  console.log('Visit the url: ', url);
  rl.question('Enter the code here:', function (code) {
    // request access token
    oauth2Client.getToken(code, function (err, tokens) {
      if (err) {
        return callback(err);
      }
      // set tokens to the client
      // TODO: tokens should be set by OAuth2 client.
      oauth2Client.setCredentials(tokens);
      callback();
    });
  });
}

// retrieve an access token
getAccessToken(oauth2Client, function () {
  // retrieve user profile
  drive.people.get({ userId: 'me', auth: oauth2Client }, function (err, profile) {
    if (err) {
      return console.log('An error occured', err);
    }
    console.log(profile.displayName, ':', profile.tagline);
  });
});
// client id: 136694865106-ll1uu2l4he308trguse34aa9hndjsthe.apps.googleusercontent.com
// secret: 0wHL9yB0qfnZPkWTrF-SO8TX
//
// 136694865106-cc8afg741s2knjgh6non30bg38ut7aok.apps.googleusercontent.com
// DRmEZAy3hUV_8OFCCRohymFL
//
