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


/**************************************3
 * SummaryDisplayCtrl.js
 * Functionality: Store configuarion information for darwing bar chars and
 *                Retrieves the chart data based oin the cofiguration
 *
 * Created By : Fintan McGee (LIST)
 * Date: 17/11/2016
 ********************************/

angular.module('LAMDAClientApp.controllers')
  .controller('SummaryDisplayCtrl', ['$scope', 'DataSet',
    function ($scope, DataSet) {
      $scope.model = {}; // keepoing model lcoal to this controller

      $scope.model.barChartAttribute =  "PRODUCTIVITY";
      $scope.model.barChartAttributeGroup =  "PRODUCTIVITY_LEVEL";
      $scope.model.selectedLabelField = "RUN_ID";

      $scope.model.chartMatrix = [];
      $scope.model.chartsPerRow = 3;


      $scope.getDivClass= function() {
        var maxBlocks = 12;
        var graphBlocks =Math.floor(maxBlocks / $scope.model.chartsPerRow);
        return "col-sm-" +graphBlocks ;
      };

      $scope.buildChartDefinitions = function() {
        // eache current displaye numeric value will
        //
        // be displayed for each factor
        //row for facot col for numeric
        var schema = DataSet.schema(),
          displayAttribs = schema.filter(x => x.displayOnLoad),
          factorAttribs = [{name:"All"}].concat(displayAttribs.filter(x => x.type === "factor")),
          numericAttribs = displayAttribs.filter(x => x.type === "numeric" ),
          labelfield = DataSet.idField(),
          visIndex = 1;

        // Line eblow was to tes tof ALl was the issue, it wasn't
       // factorAttribs = displayAttribs.filter(x => x.type === "factor" );
        factorAttribs = factorAttribs.slice(0,12); //limiting display to 12 charts per row
        $scope.model.chartsPerRow = factorAttribs.length;
        numericAttribs.forEach(function(numericItem) {

          var chartRow = [];
          factorAttribs.forEach(function(factorItem) {
            chartRow.push({labelfield:labelfield,
              attributefield:numericItem.name,
              attributegroupfield:factorItem.name,
              height : "400",
              id:"summaryvis" + visIndex++});
          });
          $scope.model.chartMatrix.push(chartRow);
        });
      };
      $scope.getSummaryChartData = function() {
        var dataSet = angular.copy(DataSet.brushed());
        if(dataSet.length < 1) {
          dataSet = angular.copy(DataSet.data()); // current dta set creates a copy
        }
        // consider copying the above
        dataSet.forEach(function(dataItem) {
          if(dataItem.PRODUCTIVITY < 10) {
            dataItem.PRODUCTIVITY_LEVEL = "Low";
          }else if(dataItem.PRODUCTIVITY < 100) {
            dataItem.PRODUCTIVITY_LEVEL = "Medium";
          } else {
            dataItem.PRODUCTIVITY_LEVEL = "High";
          }

          if(dataItem.SHAPE < 0.2) {
            dataItem.SHAPE_LEVEL = "Low";
          }else if(dataItem.SHAPE <= 0.5) {
            dataItem.SHAPE_LEVEL = "Medium";
          } else {
            dataItem.SHAPE_LEVEL = "High";
          }

          if(dataItem.DIMENSIONAL_ACCURACY < 0.13) {
            dataItem.DIMENSIONAL_ACCURACY_LEVEL = "High";
          }else if(dataItem.DIMENSIONAL_ACCURACY <= 1.3) {
            dataItem.DIMENSIONAL_ACCURACY_LEVEL = "Medium";
          } else {
            dataItem.DIMENSIONAL_ACCURACY_LEVEL = "Low";
          }

          if(dataItem.SURFACE_FINISH < 1.5) {
            dataItem.SURFACE_FINISH_LEVEL = "High";
          }else if(dataItem.SURFACE_FINISH <= 10) {
            dataItem.SURFACE_FINISH_LEVEL = "Medium";
          } else {
            dataItem.SURFACE_FINISH_LEVEL = "low";
          }

          if(dataItem.WASTE < 20) {
            dataItem.WASTE_LEVEL = "Low";
          }else if(dataItem.WASTE <= 70) {
            dataItem.WASTE_LEVEL = "Medium";
          } else {
            dataItem.WASTE_LEVEL = "High";
          }

          if(dataItem.ECONOMIC_VOLUME < 100) {
            dataItem.ECONOMIC_VOLUME_LEVEL = "Low";
          }else if(dataItem.ECONOMIC_VOLUME <= 100000) {
            dataItem.ECONOMIC_VOLUME_LEVEL = "Medium";
          } else {
            dataItem.ECONOMIC_VOLUME_LEVEL = "High";
          }

          if(dataItem.CYCLE_TIME < 20) {
            dataItem.CYCLE_TIME_LEVEL = "Low";
          }else if(dataItem.CYCLE_TIME <= 40) {
            dataItem.CYCLE_TIME_LEVEL = "Medium";
          } else {
            dataItem.CYCLE_TIME_LEVEL = "High";
          }
        });
        return dataSet;

      };
      $scope.init = function() {
        console.log("initlialising summary Display");
        $scope.buildChartDefinitions();
      }
    }]
  );