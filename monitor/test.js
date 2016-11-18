'use strict';
const diskspace = require('diskspace');
const WARNING_THRESHOLD = 10;
diskspace.check('/mnt/usbdrive', function (err, total, free, status)
{
  console.log(free/total*100+ '%');
});

