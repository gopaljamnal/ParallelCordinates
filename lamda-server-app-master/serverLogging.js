/*
    LAMDA - Server
    
    Copyright 2019 Luxembourg Institute of Science and technology <tto@list.lu>.
                   All rights reserved.
*/
/**
 * A simple module that adds timestamps to logging messages ( that are sent to console
 * and allows for a debug mode (higher level of logging)
 * @module serverlogging
 * @author Fintan McGee (LIST) fintan.mcgee@list.lu
 */
var  cfg = require('app-config');
var config = cfg.server; // @private configuration file for module to retreive debug info
var DEBUG_MODE = config.DEBUG_MODE || false; // @member whether or not to print debug log info
var fs = require('fs');
var default_debug_log_fileName =  "./debug_log1.log";// @member configuration file for module to retreive debug info


// was originally going to  write to an output file
// but it is easier to just redirect standard outpout to a file from command line

/**
 * Print to a debug log if debug model is disables ( prints to console by default)
 * @param {String} msg A string message to be written to the log
 * @param {String} source As string naming where the log message was called from
 * @param {String} dataObject A data object to be stringified as part of the message
 *
 * @author Fintan McGee (LIST) fintan.mcgee@list.lu
 */
module.exports.debug_log = function(msg, source,dataObject) {

  if(DEBUG_MODE) {
    var logMsg = new Date().toString() +  (source?"["+ source + "]" :"") + ":\t";
    logMsg += msg + (dataObject?"\nData:\t"+ JSON.stringify(dataObject) + "" :"")
    console.log(logMsg);
  }
}
/**
 * Print to a log (even if debug mode is disabled, prints to console by default)
 * @param msg {String} A string message to be written to the log
 * @param source {String} As string naming where the log message was called from
 * @param dataObject {Object} A data object to be stringified as part of the message
 *
 * @author Fintan McGee (LIST) fintan.mcgee@list.lu
 */
module.exports.log = function(msg,source,dataObject) {
  var logMsg  = new Date().toString() +  (source?"["+ source + "]" :"") + ":\t";
  logMsg += msg + (dataObject?"\nData:\t"+ JSON.stringify(dataObject) + "" :"")
  console.log(logMsg);
}
/**
 * Print to a debug log if debug model is disables ( prints to console by default)
 * @param msg {String} A string message to be written to the log
 * @param source {String} As string naming where the log message was called from
 * @param dateObject {Object} Can be passesd in to give the entry an unqiue file identified by timestamp.
 *        can be useful if you want different processes in different files
 *        often dateObject will be: new Date()
 *
 * @author Fintan McGee (LIST) fintan.mcgee@list.lu
 */
module.exports.log_debug_file = function  (msg, source,dateObject) {
  // date object can be passed in to give the entry an unique file identified by time-stamp.
  // can be useful if you want different processes in different files
  // often dateObject will be: new Date()
  var logMsg = new Date().toString() +  (source?"["+ source + "]" :"") + ":\t";
  logMsg += msg;
  var fname = default_debug_log_fileName;
  if(dateObject) {
    var dateString = dateObject.toISOString();
    dateString = dateString.replace(/:/g,"_");
    fname ="./debug_" + dateString + ".log";
  }
  fs.writeFile(fname,logMsg);
}

//module.exports.debug_log = debug_log;
//module.exports.log = log;
//module.exports.log_debug_file = log_debug_file;