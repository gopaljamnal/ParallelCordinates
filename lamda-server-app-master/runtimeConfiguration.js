/*
    LAMDA - Server
    
    Copyright 2019 Luxembourg Institute of Science and technology <tto@list.lu>.
                   All rights reserved.
*/

/**
 * Simple module to keep track of server state across application
 *         e.g. which functionality e.g. dr methods are available etc.
 *
 *
 * @module runtimeConfiguration
 * @author Fintan McGee (LIST) fintan.mcgee@list.lu
 */

// created by Fintan McGee 22/08/2019
var  cfg = require('app-config');

var appConfig= {
  data: {
    schema: [], // never populated here but refers to data module
    dimensions: {
      rows: -1,
      cols: -1
    },
    info:undefined,
  },
    cluster:{}, // should cotian types of clustering e.g. kmemans and th necessary attribute
    dimred:{},
    similarity:{},
    authenticationEnabled:false // indicates to frond end whether server uses authentication, and should a logout button be shown
  };

  appConfig.authenticationEnabled  = cfg.server.useKeycloakAuthentication;

module.exports.getAppConfig = function() {
  return appConfig
};
module.exports.setDataDimensions = function(rowCount, colCount) {
  appConfig.data.dimensions.rows = rowCount;
  appConfig.data.dimensions.cols = colCount;
};
module.exports.setClusteringMethods = function(clusterMethods) {
  appConfig.cluster = clusterMethods;
};
module.exports.setDimensionalityReductionMethods = function(dimRedMethods) {
  appConfig.dimred = dimRedMethods;
};
module.exports.setSimilarityMethods = function(similarityMethods) {
  appConfig.similarity = similarityMethods;
};
module.exports.setSchema = function(schemaObj) {
  appConfig.data.schema = schemaObj;
};
module.exports.setAuthenticationEnabled = function(authEnabled) {
  appConfig.authenticationEnabled = authEnabled;
};
module.exports.getAuthenticationEnabled = function() {
  return appConfig.authenticationEnabled;
};
module.exports.setDataSetInfo = function(dataSetInfo) {
  appConfig.data.info = dataSetInfo;
};
