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
 * detaildisplayctrl.js
 * Functionality: Store configuration information for drawing bar chars and
 *                Retrieves the chart data based on the cofiguration
 *
 * Created By : Fintan McGee (LIST)
 * Date: 27/06/2019
 ********************************/

angular.module('LAMDAClientApp.controllers')
  .controller('DetailDisplayCtrl', ['$scope','$rootScope', 'DataSet', 'Color',
    function ($scope, $rootScope,DataSet, Color) {
      $scope.model = {}; // keep oing model lcoal to this controller

      $scope.orderByField = "none";

      $scope.model.selectedLabelField = "RUN_ID";
      $scope.model.availableFields = ["default", "Stiffness_kN_mm","Max_Princ_Stress_MPa","Mass_Kg"];
      $scope.model.sortField = $scope.model.availableFields[0];
      $scope.model.data;
      $scope.model.sortOrderOptions = ["Ascending", "Descending"];
      $scope.model.sortOrder = $scope.model.sortOrderOptions [0];
      $scope.model.useExistingColorScheme = false; // specific whether or not we should use the existing scheme if one exists

      $scope.initSummaryChartData = function() {
        var dataSet = angular.copy(DataSet.brushed());
        if(dataSet.length < 1) {
          dataSet = angular.copy(DataSet.data()); // current dta set creates a copy
        }

        // consider copying the above
        var colorMap = Color.colorMap();
        if(colorMap) {
          $scope.model.useExistingColorScheme = true;
        }
        dataSet.forEach(function(dataItem,index) {
          // if the data set needs to be rpeocesses
          dataItem.sortOrder = index;
          dataItem.default = index;
          if(colorMap) {
            if(colorMap[dataItem.row]) {
              dataItem.color = colorMap[dataItem.row];
            }
          }
        });
        return dataSet;
      };

      $scope.getSummaryChartData  = function() {

        return $scope.model.data;
      }
      $scope.init = function() {
        console.log("initlialising summary Display");

        $scope.model.availableDataItems = [];
        $scope.model.data =  $scope.initSummaryChartData();

      }


      var resortData = function(fieldname, direction) {
        var compareFunc = function(a,b) {
          //var retval = parseFloat(a[fieldname]) - parseFloat(b[fieldname])
          return a[fieldname] - b[fieldname];
        };

        if( direction === "Descending") {
          compareFunc = function(a,b) {
            return b[fieldname] - a[fieldname];
          };
        }
        $scope.model.data.sort(compareFunc);
        $scope.model.data.forEach(function(dataItem,index) {

          dataItem.sortOrder = index;
        });
        $scope.$broadcast("chartDataUpdated");
      }
      $scope.$watch( 'model.sortField' , function(newValue, oldValue) {
        if( newValue !==  oldValue) {
          resortData(newValue, $scope.model.sortOrder);
        }
      })

      $scope.$watch('model.sortOrder' , function(newValue, oldValue) {
        if( newValue !==  oldValue) {
          resortData($scope.model.sortField , newValue);
        }
      })

      $scope.highlightItems = function(itemNameArray) {
        $rootScope.$broadcast("DataSet::highlight", itemNameArray)
      }
    }]
  );