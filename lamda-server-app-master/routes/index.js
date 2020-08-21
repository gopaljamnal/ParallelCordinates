/*
    LAMDA - Server
    
    Copyright 2019 Luxembourg Institute of Science and technology <tto@list.lu>.
                   All rights reserved.
*/

/**
 * A simple module that  routes all call that are not to do with data processing
 * (i.e. those thaat are app initialization, fethcing of static pages  and data retrieval)

 * @module routes/index
 * @requires express
 * @requires fs
 * @requires app-config
 * @requires ../data
 * @author Fintan McGee (LIST) fintan.mcgee@list.lu
 */

var express = require('express'),
  router = express.Router(),
  fs = require('fs'), // for file system interaction
  data = require('../data'),
  cfg = require('app-config'),
  sLog = require('../serverLogging.js'),
  runtimeConfig = require('../runtimeConfiguration');


function logReq(req){
  var reqUser = "not_specified"
  if(req.kauth) {
    reqUser = req.kauth.grant.access_token.content.preferred_username || "kcloak_not_specified";
  }
 //sLog.debug_log("Received " + req.originalUrl + " " + req.method + " request from user \""+ reqUser + "\"" , "index.js", req.body);
  sLog.log("Received " + req.originalUrl + " " + req.method + " request from user \""+ reqUser + "\"" , "index.js", req.body);
}
function serveStaticFile(filename, res) {
  var options = {
    root: __dirname + '/../public/',
    dotfiles: 'ignore',
    headers: {
      'x-timestamp': Date.now(),
      'x-sent': true
    }
  };
  res.type('.html');
  res.sendFile(filename, options, function (err) {
    if (err) {
      sLog.log("Error sending file", "app.js",err)

      res.status(err.status).end();
    } else {
      sLog.debug_log("serveStaticFile page served: " + filename, "app.js")
    }
  });
}

/* GET home page. */
router.get('/', function(req, res, next) {
  logReq(req)
  serveStaticFile("index.html", res)
  // res.render('index', { title: 'Express' });
});


router.get('/.val/json', function(req, res, next) {
  logReq(req)

  var jsonText =  fs.readFileSync('app_init_response.json','utf8');
  var  cfgData = JSON.parse(jsonText);

  // serveStaticFile("index.html", res)
  // res.render('index', { title: 'Express' });
  res.json(cfgData)
});

//router.post('/app.init',auth.check, function(req, res, next) {
  router.post('/app.init', function(req, res, next) {
    logReq(req);

    // if(req.body.dataSetName){
    //
    // }

  // reads file from composelector-server-app root folder
  // as opposed to the version the the public folder which is used for direct d3 front end calls using any web server
  var timeoutVal = cfg.server.dataWaitTimeout || 5000;
//  var timeoutVal = cfg.server.useKeycloakAuthentication;

  if(data.dataLoaded() ) {
    timeoutVal = 0;
  }
  var appConfiguration;
  function sendAppInitResponse() {
    const appConfig=runtimeConfig.getAppConfig();
    res.json(appConfig);
  }

  // the below functionality is mostly  not needed as the server is usually busy loading the data and cannot respond
  // to requests while that is happening
  // however this might not always be the case , so we have added an asynchronous check to make sure data is loaded

  var dataLoadCount = 0;
  function waitUntilDataLoaded() {
    if(data.dataLoaded() ) {
      sendAppInitResponse();
    }
    else if(dataLoadCount > 10) {
      res.json({err: "server was unable to load data set"})
    }else{
      setTimeout(function() {
        dataLoadCount++;
        console.log( dataLoadCount + " data load wait(s) completed")
        waitUntilDataLoaded();
      }, timeoutVal);
    }
  }

  waitUntilDataLoaded();

});

/**
 * Route serving login form.
 * @name post/data.login
 * @function
 * @memberof module:routers/index
 * @inner
 * @param {string} req - Express path
 * @param {callback} middleware - Express middleware.
 */
router.post('/data.get', function(req, res, next) {
  logReq(req);
  //
  // var jsonText =  fs.readFileSync('app_init_response.json','utf8');
  //  var  cfg = JSON.parse(jsonText);
  var returnData = data.get(  req.body.variables);
  // Just count number of rows from the column "row" if exists
  if(returnData.length) {
    if(returnData[0].hasOwnProperty("row")){
      var colcount = 0;
      for(var pIndex in returnData[0]) {
        colcount++;
      }
      console.log("Returning " + returnData.length + " rows and " + colcount + " columns" )
    }
  }

  res.json(returnData)
});

router.post('/data.schema', function(req, res, next) {
  logReq(req);
  //
  // var jsonText =  fs.readFileSync('app_init_response.json','utf8');
  //  var  cfg = JSON.parse(jsonText);
  var schemaData = data.schema();

  res.json(schemaData)
});

router.post('/data.removeTag', function(req, res, next) {
  logReq(req);
  data.removeTag(  req.body.name);
  res.json({msg: "tag Removed"})
});

router.post('/data.addTag', function(req, res, next) {
  logReq(req);
  console.log("Received add.tag \"" +  req.body.name + "\" request");
  data.addTag(  req.body.name ,   req.body.data);
  res.json({msg: "tag added"})
});
router.post('/data.getDatasetList', function(req, res, next) {
  logReq(req);
  console.log("get Dataset list ...");
  data.getDatasetList(function(datasetList){
    res.json(datasetList)
  });

});

router.post('/data.getCurrentDatasetInfo', function(req, res, next) {
  logReq(req);
  console.log("get Dataset list ...");
  data.getDataset(function(dataset){
    res.json(dataset)
  });

});
router.post('/data.sendDatasetFile', function(req, res, next) {
  logReq(req);
  console.log("send Dataset File ...");
  console.log(req.files);
  const metadata=JSON.parse(req.body.metadata);
  console.log(metadata);
  const filePath="./data/Upload"+Date.now()+".csv";
  const params={name:metadata.name,  shortDesc:metadata.shortDesc,filePath:filePath};
  req.files.file.mv(filePath,function(err){
    if (err)
      return res.status(500).send(err);
    data.importUploadedDataset(params,function(){
      const schema=data.schema();
      // const data=data.get()
      res.json(schema)
    });
  });

});

router.post('/data.getSchemaForDataset', function(req, res, next) {
  logReq(req);
  console.log("Load dataset: "+req.body.dataSetName);
  data.loadDataFromDB(req.body.dataSetName,function(){
    // var returnData = data.get(  req.body.variables);
    const schema=data.schema();
    res.json(schema);
  });
});


router.post('/data.loadDatasetFile', function(req, res, next) {
  logReq(req);
  console.log("Load dataset: "+req.body.dataset.name);
  data.loadDataFromDB(req.body.dataset.name,function(){
    var returnData = data.get(  req.body.variables);
    res.json(returnData);
  });
});

//loadDatafromCSV();
sLog.log("Finished loading index router ( for data and pages)", "index.js");
module.exports = router;
