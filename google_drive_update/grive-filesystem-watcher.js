//Version 0.1.0
//To run this script use: node <script_name.js>
//This script watches for changes in the current directory and all subdirectories.
//If a change is detected then the 'grive' tool is called, which is assumed to be in the same directory as this script.
//On startup, the 'grive' tool is also called.
//All output from 'grive' is displayed on the console.
//Directories created in one of the monitored folders, while the program runs, are automatically also monitored.
//Make sure the user running the script has permissions to read and write files in all subdirectories.
//This script was first published at: http://www.home-automation-community.com/ 
//You may republish it as is or publish a modified version only when you quote the source 'http://www.home-automation-community.com/'

var fs            = require('fs');
var child_process = require('child_process');

var BaseDir          = '.';
var Cmd              = './grive';
var CmdRetryAttempts = 5;
var IsSyncNeeded     = true;
var IsCmdExecuting   = false;
var MonitoredDirs    = [];

getDirectoriesRec(BaseDir).forEach(addDirectoryToMonitor);
console.log("->Waiting for changes in the directory '%s' and its subdirectories.", BaseDir);
waitForChangesLoopAsync();

function waitForChangesLoopAsync() {
  if (IsSyncNeeded && !IsCmdExecuting) {
    //Changes were detected and command is not running --> Execute command
    IsSyncNeeded = false;
    executeCmd(Cmd, 0);
  }
  setTimeout(waitForChangesLoopAsync, 1000);
}

//Note that the spawn function is async, so the executeCmd function returns while the command is still executing.
function executeCmd(cmd, retryCount) {
  IsCmdExecuting = true;
  console.log("->Calling '%s'.", cmd);
  var ps = child_process.spawn(cmd);
  //data comes not line by line but rather word by word.
  ps.stdout.on('data', function(data) { process.stdout.write(data.toString()); });
  ps.stderr.on('data', function(data) { process.stdout.write(data.toString()); });
  ps.on('close', function (code) {
    if (code !== 0 && retryCount < CmdRetryAttempts) {
      executeCmd(cmd, ++retryCount);
    }
    else if (code !== 0)
    {
      throw new Error("Error calling '%s'.", cmd);
    }
    else
    {
      console.log("->Successfully completed command '%s'.", cmd);
    }
	IsCmdExecuting = false;
  });
}

function getDirectoriesRec(dirPath) {
  var baseDirs = fs.readdirSync(dirPath).filter(function (file) {
    return isDirectory(dirPath + '/' + file);
  });
  var allDirs = [dirPath];
  baseDirs.forEach(function(dir) {
    var subDirPath = dirPath + '/' + dir;
    allDirs.push(subDirPath);
    allDirs = allDirs.concat(getDirectoriesRec(subDirPath));
  });
  return allDirs;
}

function directoryChangedCallback(dirPath, event, filename) {
  var fullPath = dirPath + '/' + filename;
  if (fs.existsSync(fullPath) && isDirectory(fullPath)) {
    //If there is a change and the change is a directory and the directory exists (it is not deleted)
	//then it must be new. Variable 'event' was always 'change' even for new or deleted directories.
    addDirectoryToMonitor(fullPath);
	console.log("->New directory '%s' will be monitored.", fullPath);
  }
  else if (!fs.existsSync(fullPath) && MonitoredDirs.indexOf(fullPath) != -1) {
    console.log("->Directory '%s' was deleted.", fullPath);
  }
  if (!IsSyncNeeded && filename != '.grive' && filename != '.grive_state') {
    console.log("->Detected changes in the monitored directories.");
    IsSyncNeeded = true;
  }
}

function addDirectoryToMonitor(fullDirPath) {
  fs.watch(fullDirPath, function(event, filename) { 
    directoryChangedCallback(fullDirPath, event, filename); 
  });
  MonitoredDirs.push(fullDirPath);
}

function isDirectory(fullPath) {
  return fs.statSync(fullPath).isDirectory();
}

