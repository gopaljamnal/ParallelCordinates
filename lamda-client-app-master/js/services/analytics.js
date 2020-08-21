/*jslint todo:true, nomen: true, indent: 2 */
/*global angular, ocpu, _ */

/*
    LAMDA - Client
    
    Copyright 2019 Luxembourg Institute of Science and technology <tto@list.lu>.
                   All rights reserved.

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

angular.module('LAMDAClientApp.services')
  .service('Analytics', function ($rootScope, DataSet, $http,AppStatus) {

    'use strict';

    var d = {
      clusterMethods: [],
      dimRedMethods: [],
      similarityMethods:[],
    };

    /*jslint unparam: true */
    $rootScope.$on("App::configurationLoaded", function (ev, appConfig) {
      d.clusterMethods = _.reduce(_.keys(appConfig.cluster), function (methods, method) {
        methods.push({ name: method, args: appConfig.cluster[method] });
        return methods;
      }, []);
      $rootScope.$broadcast("Analytics::clusterMethodsAvailable", d.clusterMethods);

      d.dimRedMethods = _.reduce(_.keys(appConfig.dimred), function (methods, method) {
        var cfg = appConfig.dimred[method];
        cfg.name = method;
        methods.push(cfg);
        return methods;
      }, []);
      $rootScope.$broadcast("Analytics::dimRedMethodsAvailable", d.dimRedMethods);

      // TODO: how similarity keys are defined ?
      d.similarityMethods = _.reduce(_.keys(appConfig.similarity), function (methods, method) {
        methods.push({ name: method, args: appConfig.similarity[method] });
        return methods;
      }, []);
      $rootScope.$broadcast("Analytics::similarityMethodsAvailable", d.similarityMethods);

    });
    /*jslint unparam: false */

    return {
      clusterMethods: function () {
        return d.clusterMethods;
      },

      dimRedMethods: function () {
        return d.dimRedMethods;
      },

      similarityMethods: function () {
        return d.similarityMethods;
      },

      cluster: function (method, variables, args, id) {
        // clustering for non filtered data
        var fnArgs = {
          vars: variables,
          identifier: id
        };
        if (DataSet.rows()) {
          fnArgs.rows = DataSet.rows();
        }
        _.each(_.keys(args), function (key) {
          fnArgs[key] = args[key];
        });

        var fnName = "cluster." + method;
        AppStatus.setDataProcessing(true);
        $http({method: 'POST', url: "/ocpu/cluster/",data: {functionName:fnName,args:fnArgs}}).then (function(DRresponse) {
          AppStatus.setDataProcessing(false);
          AppStatus.setStatus("Processing result of clustering...");
          $rootScope.$broadcast("Analytics::dataUpdated", id)

        })
        // ocpu.call("cluster." + method, fnArgs, function () {
        //   $rootScope.$broadcast("Analytics::dataUpdated", id);
        // });
      },
      clusterData: function (method, variables, args, id) {
        // clustering for filtered data
        var fnArgs = {
          vars: variables,
          identifier: id
        };
        if (DataSet.rows()) {
          fnArgs.rows = DataSet.rows();
        }
        _.each(_.keys(args), function (key) {
          fnArgs[key] = args[key];
        });

        var fnName = "cluster." + method +  ".data";
        AppStatus.setDataProcessing(true);
        $http({method: 'POST', url: "/ocpu/clusterdata/",data: {functionName:fnName,args:fnArgs}}).then (function(DRresponse) {
          AppStatus.setDataProcessing(false);
          AppStatus.setStatus("Processing result of clustering...");
          $rootScope.$broadcast("Analytics::dataUpdated", id)

        })
        // ocpu.call("cluster." + method, fnArgs, function () {
        //   $rootScope.$broadcast("Analytics::dataUpdated", id);
        // });
      },

      reduce: function (method, variables) {
        // (Deprecated) dimension reduction without filtering data
        var fnArgs = {
          vars: variables
        };
        if (DataSet.rows()) {
          fnArgs.rows = DataSet.rows();
        }

        var fnName = "dimred." + method;
        AppStatus.setDataProcessing(true);
        $rootScope.$broadcast("Analytics::DimensionalityReductionCalled",{method,variables});
        $http({method: 'POST', url: "/ocpu/DR/",data: {functionName:fnName,args:fnArgs}}).then (function(DRresponse) {
          AppStatus.setDataProcessing(false);
          AppStatus.setStatus("Processing result of dimensionality reduction...");
          $rootScope.$broadcast("Analytics::dimensionalityReduced", method, DRresponse.data);
        })

        // ocpu.call("dimred." + method, fnArgs, function (session) {
        //   $rootScope.$broadcast("Analytics::dimensionalityReduced", method, session);
        // });
      },

      reduceData: function (method, variables) {
        // dimension reduction with filtering data
        var fnArgs = {
          vars: variables
        };
        if (DataSet.rows()) {
          fnArgs.rows = DataSet.rows();
        }

        var fnName = "dimred." + method + ".data";
        AppStatus.setDataProcessing(true);
        $rootScope.$broadcast("Analytics::DimensionalityReductionCalled",{method,variables});
        $http({method: 'POST', url: "/ocpu/DRdata/",data: {functionName:fnName,args:fnArgs}}).then (function(DRresponse) {
          AppStatus.setDataProcessing(false);
          AppStatus.setStatus("Processing result of dimensionality reduction...");
          $rootScope.$broadcast("Analytics::dimensionalityReduced", method, DRresponse.data);
        })

        // ocpu.call("dimred." + method, fnArgs, function (session) {
        //   $rootScope.$broadcast("Analytics::dimensionalityReduced", method, session);
        // });
      },
      similarityData: function (method, variables, args){ //, id) {
        // similarity function for filtered data
      /* vars:[string]
        *    The list of variables to consider for KNN
        * rows:[] array with row ids
        *    The list of rows to consider for the KNN
        * rowId:int
        *    The id of the row used as reference to search KNNs
        * k:int
        *    The number of nearest neighbors to retrieve
       */
        var fnArgs = {
          vars: variables,
          // rowId: id, // given in args
          // k:k, // given in args
        };
        if (DataSet.rows()) {
          fnArgs.rows = DataSet.rows();
        }
        _.each(_.keys(args), function (key) {
          fnArgs[key] = args[key];
        });

        var fnName = "similarity." + method +  ".data";
        AppStatus.setDataProcessing(true);
        $http({method: 'POST', url: "/ocpu/computeKNN/",data: {functionName:fnName,args:fnArgs}})
            .then (function(dataResponse) {
          AppStatus.setDataProcessing(false);
          AppStatus.setStatus("Processing result of similarity search...");
          $rootScope.$broadcast("Analytics::similarityRetrieved", dataResponse.data)

        })
        // ocpu.call("cluster." + method, fnArgs, function () {
        //   $rootScope.$broadcast("Analytics::dataUpdated", id);
        // });
      },

    };

  });
