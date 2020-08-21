/*jslint indent: 2, nomen: true */
/*global angular, _ */

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
/**************************************
 * similarityctrl.js
 * Functionality: Similarity search copnfiguratuib
 *
 * Created By : Nicolas Medoc (LIST)
 * Date: 12/05/2020
 ********************************/

angular.module('LAMDAClientApp.controllers')
  .controller('SimilarityCtrl', function ($scope, $modal, Analytics, R,DataSet,AppStatus) {

    'use strict';

    var d = {
      schema: undefined
    };

    function setVariables() {
      $scope.options.variables = _.filter(d.schema, function (variable) {
        return variable.analysable;
      });
    }

    function performSimilarity(config) {
      var args = {};
      // FIXME: Generalize this code, we don't want to change this code for
      //        every clustering method we add.
      if (config.method.name === "KNN") {
        args.metric = config.metric;
        args.k = config.k;
        args.rowId = config.rowId;
      } else {
        throw "Unknown similarity method: " + config.method.name;
      }
      AppStatus.setStatus("Calling similarity search...")
      Analytics.similarityData(
        config.method.name,
        _.map(config.variables,
              function (variable) { return variable.name; }),
        args
      );
    }

    // Available similarity search options.
    $scope.options = {
      methods: [],
      metrics:[],
      variables: [],
      rowId:undefined,
      valid: function () {
        return $scope.options.methods.length > 0
            && $scope.options.metrics.length > 0
            && $scope.options.variables.length > 2;
      }
    };

    $scope.canApply = false;

    /*jslint unparam: true */
    $scope.$on('DataSet::schemaLoaded', function (e, schema) {
      d.schema = schema;
      setVariables();
      $scope.canApply = $scope.options.valid();

    });
    /*jslint unparam: false */

    /*jslint unparam: true */
    $scope.$on('Analytics::similarityMethodsAvailable', function (e, methods) {
      $scope.options.methods = methods;
      $scope.canApply = $scope.options.valid();
    });
    /*jslint unparam: false */

    $scope.$on('DataTable::rowSelection', function (e, rowId) {
       $scope.options.rowId=rowId;
    });

    $scope.openSelectionDialog = function () {
      // TODO: create and use js/templates/similarityconfig.html and SimilarityConfigCtrl instead of using ClusterConfig
      var dialog = $modal.open({
        templateUrl: 'js/templates/similarityconfig.html',
        size: 'md',
        controller: 'SimilarityConfigCtrl',
        resolve: {
          options: function () {
            return $scope.options;
          }
        }
      });

      if( DataSet.schema()){
        d.schema = DataSet.schema();
        setVariables();

        if( $scope.options.methods.length < 1) {
          // in case where similarity methods have already been retrieved by the time this contoller is being instantiated
          $scope.options.methods = Analytics.similarityMethods();
          $scope.canApply = $scope.options.valid();
        }
      }


      dialog.result.then(performSimilarity);
    }; // end openSelectionDialog()
  });
