'use strict';
const fs = require('fs');
const exec = require('child_process').exec;
const path = require('path');
const dMvmt = '/mnt/usbdrive/video-movement';
const dGDrive = '/mnt/usbdrive/gdrive/video-apt';

fs.watch(dMvmt, function (event, filename) {
  console.log('event is: ' + event);
  var tFileName = null;
  if (filename) {
    console.log('filename provided: ' + filename);
    tFileName = path.join(dGDrive, filename);
    if (fs.existsSync(path.join(dMvmt, filename))) {
      fs.writeFileSync(tFileName,
        fs.readFileSync(path.join(dMvmt, filename)));
      console.log('Syncing file: %j', tFileName);
      var tmpDrive = dGDrive + '/..';
      var grive = exec('grive', {cwd: tmpDrive});
      grive.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
      });
      grive.on('close', (code) => {
        console.log(`child process exited with code ${code}`);
      });
    } else {
      console.log('file %j deleted', filename);
    }
      
  } else {
      console.log('filename not provided');
  }
});
