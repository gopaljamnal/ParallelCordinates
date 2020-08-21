/*
    LAMDA - Server
    
    Copyright 2019 Luxembourg Institute of Science and technology <tto@list.lu>.
                   All rights reserved.
*/

/**
 * A simple module that  routes all call that for data processing when OPENCPU ( an R server) is the destination
 * (Which is specified in the application configuration file)

 * @module routes/index
 * @requires express
 * @requires fs
 * @requires opencpu
 * @requires ../data
 * @requires ../serverLogging.js
 * @requires ../runtimeConfiguration
 * @requires ../data
 * @author Fintan McGee (LIST) fintan.mcgee@list.lu
 */
var express = require('express'),
  router = express.Router(),
  r = require('request'),
  ocpu = require("opencpu"),
  sLog = require('../serverLogging.js'),
  runtimeConfig = require('../runtimeConfiguration');;

var   fs = require('fs'); // for file system interaction

var data = require('../data')


function logReq(req){
  var reqUser = "not_specified"
  if(req.kauth) {
    reqUser = req.kauth.grant.access_token.content.preferred_username || "kcloak_not_specified";
  }
  sLog.debug_log("Received " + req.originalUrl + " " + req.method + " request from user \""+ reqUser + "\"" , "index.js", req.body);
}
/* GET users listing. */
router.get('/', function(req, res, next) {
  logReq(req)
  res.send('openCPURoute');

});



// function to get the actual resutls form the open CPU server and then send them back to the fornt end
function asJson(res,functionId) {
  var me= {};
  me.functionId = functionId
  return function (error,session,otherstuff) {
    //$http({method: 'GET', url: session.loc + "R/.val/json?auto_unbox=true"})
    //var loc = "http://localhost:5307/ocpu/tmp/" + session + "/";
    if(!error) {
      var urlPrefix = "http://localhost:5307/ocpu/tmp/" + session + "/";
      var fullURI = urlPrefix + "R/.val/json?auto_unbox=true"

      r.get({uri: fullURI,json:true}, //headers
            function (error,getResp,openCPUResult) {
          // bundle u the data and send it back to the front end
         // response.json({session: session, ocpuData: getBody})
              var itemDescription = "";
              if(openCPUResult.length) {
                itemDescription = " \t:" + openCPUResult.length + " items, first item: " + JSON.stringify(openCPUResult[0]);
              }
              console.log(new Date().toISOString() + ": Returning open cpu data  for function "  + me.functionId +  itemDescription)
              sLog.debug_log("OPENCPU DATa returned", "opencpu.js" , openCPUResult);
              if(me.functionId.indexOf("app.init") >-1) {
                fs.writeFile("./app.init1.json", JSON.stringify(openCPUResult), function(err) {
                    if(err)  {
                      console.log("Error Writing file");
                    } else {
                      console.log("file written successfully");
                    }

                })
              }
              res.json(openCPUResult)
        });
    } else {
      console.log("Open CPU error occured: " +   me.functionId + " " +session );
      res.json({msg:"Open CPU error occured" + me.functionId });
    }
  };
}


// functioon to update the data with specified clustering
function asClusteringJsonDataUpdate(res,functionId,colName) {
  var me= {};
  me.functionId = functionId
  return function (error,session,otherstuff) {
    //$http({method: 'GET', url: session.loc + "R/.val/json?auto_unbox=true"})
    //var loc = "http://localhost:5307/ocpu/tmp/" + session + "/";
    if(!error) {
      var urlPrefix = "http://localhost:5307/ocpu/tmp/" + session + "/";
      var fullURI = urlPrefix + "R/.val/json?auto_unbox=true"

      r.get({uri: fullURI,json:true}, //headers
        function (error,getResp,openCPUResult) {
          // bundle u the data and send it back to the front end
          // response.json({session: session, ocpuData: getBody})
          var itemDescription = "";
          if(openCPUResult.length) {
            itemDescription = " \t:" + openCPUResult.length + " items, first item: " + JSON.stringify(openCPUResult[0]);
          }

          fs.writeFile("./clusterData_R_Resp.json", JSON.stringify(openCPUResult), function(err) {
            if(err)  {
              console.log("Error Writing clsuterDataResp");
            } else {
              console.log("clusterDataResp written successfully");
            }

          })
          console.log(new Date().toISOString() + ": Returning open cpu data  for function "  + me.functionId +  itemDescription)
          data.addCol(colName,openCPUResult);


          // just send the col name the froint end can request the data later
          res.json({id:colName})
        });
    } else {
      console.log("Open CPU error occured: " +   me.functionId + " " +session );
      res.json({msg:"Open CPU error occured: " + me.functionId });
    }
  };
}

router.post('/json/', function(req, res, next) {
  logReq(req)
  // procesing call back will be handled at front end, but we need to send the data back


  var dateString = new Date().toISOString();
  dateString = dateString.replace(/:/g,"_");
  var callID = req.body.functionName + "_"  +dateString
  console.log(new Date().toISOString() + ": Received OCPU Json Call: " +callID )
  ocpu.rCall("/library/Composelector/R/" +req.body.functionName, req.body.args,asJson(res,callID));

});

router.post('/DR/', function(req, res, next) {
  // deprecated function from when data was stored in r backend
  logReq(req);
  // procesing call back will be handled at front end, but we ne to sen the data back


  var dateString = new Date().toISOString();
  dateString = dateString.replace(/:/g,"_");
  var callID = req.body.functionName + "_"  +dateString
  console.log(new Date().toISOString() + ": Received OCPU DR Call: " +callID )
  ocpu.rCall("/library/Composelector/R/" +req.body.functionName, req.body.args,asJson(res,callID));

});
router.post('/DRdata/', function(req, res, next) {
  logReq(req);
  // procesing call back will be handled at front end, but we ne to sen the data back


  var dateString = new Date().toISOString();
  dateString = dateString.replace(/:/g,"_");
  var callID = req.body.functionName + "_"  +dateString;
  console.log(new Date().toISOString() + ": Received OCPU DR Call: " +callID );
  var varList = ["row", data.idFieldName()].concat(req.body.args.vars);


  var filteredData = data.filter(req.body.args.rows,varList);




  ocpu.rCall("/library/Composelector/R/" +req.body.functionName, {data:filteredData},asJson(res,callID));

});

router.post('/cluster/', function(req, res, next) {
  // deprecated function from when data was stored in r backend
  logReq(req)
  // procesing call back will be handled at front end, but we ne to sen the data back


  var dateString = new Date().toISOString();
  dateString = dateString.replace(/:/g,"_");
  var callID = req.body.functionName + "_"  +dateString
  console.log(new Date().toISOString() + ": Received OCPU CLUSTER  Call: " +callID );


  ocpu.rCall("/library/Composelector/R/" +req.body.functionName, req.body.args,function(error,msg,data) {
    if(!error) {
      res.json( req.body.args.identifier)
    }
  });

});

router.post('/clusterdata/', function(req, res, next) {
  logReq(req)
  // procesing call back will be handled at front end, but we ne to sen the data back
  ///ocpu/library/ICoVeR/R/app.init

  var dateString = new Date().toISOString();
  dateString = dateString.replace(/:/g,"_");
  var callID = req.body.functionName + "_"  +dateString
  console.log(new Date().toISOString() + ": Received OCPU CLUSTER  Call: " +callID );

  var varList = ["row"].concat(req.body.args.vars);
  var filteredData = data.filter(req.body.args.rows,varList);


  ocpu.rCall("/library/Composelector/R/" +req.body.functionName, {clusterData:filteredData,identifier:req.body.args.identifier,centers:req.body.args.centers},asClusteringJsonDataUpdate(res,callID,req.body.args.identifier) );

});

router.post('/call/', function(req, res, next) {
  logReq(req);
  // procesing call back will be handled at front end, but we ne to sen the data back

  ocpu.rCall("/library/Composelector/R/" +req.body.functionName, req.body.args,asJson(res,req.body.functionName));

});

function initialiseApp() {

  // normally would pass a request object from the front end to the toJson object
  // however now were are only updating the server so there is no request form the front end
  var handler = {};
  handler.body = {};
  handler.json =  function(data) {
    sLog.debug_log("Handling R app.init response" , "openCPURouter.js", data);
    runtimeConfig.setClusteringMethods(data.cluster);
    runtimeConfig.setDimensionalityReductionMethods(data.dimred)
    runtimeConfig.setSimilarityMethods(data.similarity)
  }
  ocpu.rCall("/library/Composelector/R/app.init",{},asJson(handler,"app.init"));
}
// call: function (fn, args, cb) {
//   ocpu.call(fn, args, cb);
// },
//
// json: function (fn, args, cb) {
//   ocpu.call(fn, args, asJson(cb));
// },

initialiseApp();
router.init = function() {
  initialiseApp()
}
module.exports = router;
