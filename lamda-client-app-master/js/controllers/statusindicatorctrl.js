/*jslint indent: 2 */
/*global angular */

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
angular.module('LAMDAClientApp.controllers')
  .controller('StatusIndicatorCtrl', function ($scope) {

    'use strict';

    var overallRowCount = 0, // The total number of rows in the dataset
      currentRowCount = 0,   // The current number of rows in the views
      brushedRowCount = 0;   // The current number of rows which are brushed

    $scope.message="";
    $scope.dataLoading=false;
    $scope.dataImporting=false;
    $scope.dataProcessing=false;
    $scope.renderingProgress={parcoord:{
            rendering:false,
            rowCount:0,
            remainingRows:0,
            rows:0,
        },brush:{
            rendering:false,
            rowCount:0,
            remainingRows:0,
            rows:0,
        }
    };
    $scope.rendering=false;
    $scope.rowCount = 0;
    $scope.remainingRows = 0;
    $scope.rows = 0;
    $scope.counts = [];

      /*jslint unparam: true */
    $scope.$on("AppStatus::Message", function (ev, message) {
        $scope.message = message;
    });
      /*jslint unparam: false */
    /*jslint unparam: true */
    $scope.$on("AppStatus::ParcoordRendering", function (ev, parcoordRenderingObj) {
        const action=parcoordRenderingObj.action;
        $scope.renderingProgress[action].rendering=parcoordRenderingObj.rendering;
        if(parcoordRenderingObj.rendering) { // if start rendering init other variables
            $scope.renderingProgress[action].rowCount = parcoordRenderingObj.rowsCount;
            $scope.renderingProgress[action].remainingRows = parcoordRenderingObj.rowsCount;
            $scope.renderingProgress[action].rows = 0;
        }
        // if(parcoordRenderingObj.withApply){
        //     $scope.$apply();
        // }
    });
    /*jslint unparam: false */

    /*jslint unparam: true */
    $scope.$on("AppStatus::ParcoordRemainingRenderingNb", function (ev, remainingRenderingObj) {
        const action=remainingRenderingObj.action;
        $scope.renderingProgress[action].remainingRows = remainingRenderingObj.remainingRenderingNb;
        $scope.renderingProgress[action].rows=$scope.renderingProgress[action].rowCount-$scope.renderingProgress[action].remainingRows;
        // if(remainingRenderingObj.withApply){
        //     $scope.$apply();
        // }
    });
    /*jslint unparam: false */

    /*jslint unparam: true */
    $scope.$on("AppStatus::DataImporting", function (ev, dataImporting) {
      $scope.dataImporting = dataImporting;
    });
    /*jslint unparam: false */
    /*jslint unparam: true */
    $scope.$on("AppStatus::DataLoading", function (ev, dataLoading) {
        $scope.dataLoading = dataLoading;
    });
    /*jslint unparam: false */
      /*jslint unparam: true */
      $scope.$on("AppStatus::DataProcessing", function (ev, dataProcessing) {
          $scope.dataProcessing = dataProcessing;
      });
      /*jslint unparam: false */

  });
