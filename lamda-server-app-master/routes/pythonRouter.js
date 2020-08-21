/*
    LAMDA - Server
    
    Copyright 2019 Luxembourg Institute of Science and technology <tto@list.lu>.
                   All rights reserved.
*/

/**
 * A simple module that  routes all call that for data processing when the LAMDA python Server ( usually a LFASK server) is the destination
 * (Which is specified in the application configuration file)

 * @module routes/index
 * @requires express
 * @requires fs
 * @requires ../data
 * @requires ../serverLogging.js
 * @requires ../runtimeConfiguration
 * @requires ../data
 * @author Fintan McGee (LIST) fintan.mcgee@list.lu
 */
var express 

var express = require('express'),
  router = express.Router(),
  r = require('request'),
  sLog = require('../serverLogging.js'),
  runtimeConfig = require('../runtimeConfiguration');;

var   fs = require('fs'); // for file system interaction

var data = require('../data')
const write_request=true;

function logReq(req){
  var reqUser = "not_specified"
  if(req.kauth) {
    reqUser = req.kauth.grant.access_token.content.preferred_username || "kcloak_not_specified";
  }
  sLog.debug_log("Python Router Received " + req.originalUrl + " " + req.method + " request from user \""+ reqUser + "\"" , "index.js", req.body);
}
/* GET users listing. */
router.get('/', function(req, res, next) {
  logReq(req)
  res.send('PythonRoute');

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

  r.post({
   // uri: "http://localhost:5000/dimred.pca.data",
    uri: "http://127.0.0.1:5000/dimred.pca.data",
    headers: {
      Accept: 'application/json; charset=UTF-8'
    } ,
    json:{data:filteredData}
  }, function (error, pythonResult) {
    if(!error) {
      res.json(pythonResult.body);
    } else {
      console.log("Python processing error occured: " +   JSON.stringify(error) );
    }
  })
});

/*
 * Get the dataset with the 'rows' and 'vars' given in parameters.
 * Then it calls 'clusterdata' Python function with the 'centers' given in parameter.
 * The result will be added in the datset under a new column with the name given by 'identifier' parameter
 *
 * req.args:{
 * vars:[string]
 *    The list of variables to consider for KNN
 * rows:[] array with row ids
 *    The list of rows to consider for the KNN
 * centers:int
 *    The number of clusters (or centers) to compute
 * identifier: String
 *    The column name used to add clusters classes in the dataset
 *
 * }
 */
router.post('/clusterdata/', function(req, res, next) {
  logReq(req);
  // procesing call back will be handled at front end, but we ne to sen the data back


  var dateString = new Date().toISOString();
  dateString = dateString.replace(/:/g,"_");
  var callID = req.body.functionName + "_"  +dateString;
  console.log(new Date().toISOString() + ": Received PYthon CLUSTER  Call: " +callID );

  var varList = ["row"].concat(req.body.args.vars);
  var filteredData = data.filter(req.body.args.rows,varList);
  if(write_request) {
    fs.writeFile("./clusterData_R_Req.json", JSON.stringify({
      clusterData: filteredData,
      identifier: req.body.args.identifier,
      centers: req.body.args.centers
    }), function (err) {
      if (err) {
        console.log("Error Writing drDatafile");
      } else {
        console.log("drDatafile written successfully");
      }
    });
  }
  var colName  = req.body.args.identifier;
  r.post({
    //uri: "http://localhost:5000/cluster.kmeans",
    uri: "http://127.0.0.1:5000/cluster.kmeans",
    headers: {
      Accept: 'application/json; charset=UTF-8'
    } ,
    json:{clusterData:filteredData,identifier:req.body.args.identifier,centers:req.body.args.centers}
  }, function (error, pythonResult) {
    if(!error) {
      sLog.debug_log("clustering Repsonse:" , "pythonRouter.js" ,pythonResult.body);
      // add column to data structure first
      data.addCol(colName,pythonResult.body);

      // sending data back to front end
      res.json(pythonResult.body);
    } else {
      console.log("Python processing error occured: " +   JSON.stringify(error) );
    }
  })

});

/*
 * Get the dataset with the rows and vars given in the dataset and call Python computeKNN function with the rowId and k.
 *
 * req.args:{
 * vars:[string]
 *    The list of variables to consider for KNN
 * rows:[] array with row ids
 *    The list of rows to consider for the KNN
 * rowId:int
 *    The id of the row used as reference to search KNNs
 * k:int
 *    The number of nearest neighbors to retrieve
 *
 * }
 */
router.post('/computeKNN/', function(req, res, next) {
  logReq(req);
  // procesing call back will be handled at front end, but we ne to sen the data back


  var dateString = new Date().toISOString();
  dateString = dateString.replace(/:/g,"_");
  var callID = req.body.functionName + "_"  +dateString
  console.log(new Date().toISOString() + ": Received PYthon computeKNN  Call: " +callID );

  // add row as identifier of rows for python
  var varList = ["row"].concat(req.body.args.vars);
  var filteredData = data.filter(req.body.args.rows,varList);
  if(write_request) {
    fs.writeFile("./computeKNN_req.json", JSON.stringify({
      df_data: filteredData,
      tire_id: req.body.args.identifier,
      k: req.body.args.k,
      features: req.body.args.vars,
    }), function (err) {
      if (err) {
        console.log("Error Writing drDatafile");
      } else {
        console.log("drDatafile written successfully");
      }
    });
  }
  // rawData = dict()
  // rawData['tire_id']  = 19225               # Query tire
  // rawData['df_data']  = df_data.to_json()         # Dataset without nan values
  // rawData['k']        = 10                  # Number of tires to retrieve
  // rawData['features'] = df_data.columns[1:].to_list() # Similarity wrt this features

  r.post({
    uri: "http://127.0.0.1:5000/clinical_kernel.compute_knn",
    headers: {
      Accept: 'application/json; charset=UTF-8'
    } ,
    json:{df_data:filteredData,row_id:req.body.args.rowId,k:req.body.args.k,features:req.body.args.vars}
  }, function (error, pythonResult) {
    if(!error) {
      sLog.debug_log("compute_KNN Repsonse:" , "pythonRouter.js" ,pythonResult.body);

      // return the result to front end with only identifiers of rows
      const dataResponse=JSON.parse(pythonResult.body);
      // format of dataResponse [{colName:value}]
      // change to [{row:integer,distToQuery:float] of rowIds
      const similarRowIds=dataResponse.map((rowObj)=>{return {row:rowObj.row, distToQuery:rowObj.dist_to_query}});

      res.json(similarRowIds);
    } else {
      console.log("Python processing error occured: " +   JSON.stringify(error) );
    }
  })

});

function initialiseApp() {

  // normally would pass a request object from the front end to the toJson object
  // however now were are only updating tghe server so there is no request form the fron end
  fs.readFile("./python_app_init.json",'utf8',(err, initDataTest) => {
    if(err)  {
      sLog.log("ERROR loading python app.init file" , "pythonRouter.js", initDataTest);
    } else {
      sLog.debug_log("Loading python app.init file " , "pythonRouter.js", initDataTest);

      var initData = JSON.parse(initDataTest)
      runtimeConfig.setClusteringMethods(initData.cluster);
      runtimeConfig.setDimensionalityReductionMethods(initData.dimred)
      runtimeConfig.setSimilarityMethods(initData.similarity)
    }
  });

  // pinging pythng server
  r.post({
    //uri: "http://localhost:5000/cluster.kmeans",
    uri: "http://127.0.0.1:5000/ping",
    headers: {
      Accept: 'application/json; charset=UTF-8'
    } ,
    json:{}
  }, function (error, pythonResult) {
    if(!error) {
      sLog.log("Pyton server PING  POST response :" , "pythonRouter.js" ,pythonResult.body);
      // add column to data structure first


      // sending data back to front end

    } else {
      console.log("ERROR Python processing error occured: " +   JSON.stringify(error) );
      sLog.log("response error " +  ":" , "pythonRouter.js" ,pythonResult.body);
    }
  })
}


initialiseApp();

router.init = function() {
  initialiseApp()
}
sLog.log("Finished Loading Python router" , "pythonRouter.js");
module.exports = router;