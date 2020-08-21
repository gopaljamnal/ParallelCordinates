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
  .controller('NameHighlightCtrl', function ($scope, DataSet, Analytics, ParCoords) {
    //need to have analytics  in the above so it is always laoded with data set
    'use strict';

    var nameHash = {},
      variables = [];
      $scope.model = {};
      $scope.model.availableNames = [];
      $scope.model.rowName = "";

    function buildNameHash(data) {
      nameHash = {};
      $scope.model.availableNames = [];
      data.forEach(function (d, dataIndex) {
        variables.forEach(function (v) {
          nameHash[d[v]] = dataIndex;
          $scope.model.availableNames.push(d[v]);
        });
      });

      $scope.noHighlightAvailable = true;
      // if a row is highlighted before the event that caused the rebuild
      // we still want it to be highlighted after
      $scope.model.availableNames.sort();
     // $scope.highlightRow();
    }

    /*jslint unparam: true */
    $scope.$on('DataSet::schemaLoaded', function (e, schema) {
      applySchemaInformation(schema)
    });
    /*jslint unparam: false */
    /*jslint unparam: true */
    function applySchemaInformation(schema) {
      variables = [];
      schema.forEach(function (d) {
        if (d.group === "Id") {
          variables.push(d.name);
        }
      });

      if (variables.length > 0){
      // move it when event 'InitialDataLoaded' is launched
      // if (variables.length > 0 && DataSet.data().length>0) {
        DataSet.get(variables, buildNameHash);
      }
    };
    // $scope.$on('DataSet::initialDataLoaded', function(){
    //   if (variables.length > 0) {
    //       DataSet.get(variables, buildNameHash);
    //   }
    // });
    /*jslint unparam: false */

    /*jslint unparam: true */
    $scope.$on('DataSet::filtered', function (e, filteredData) {
      // remove highlight... it will be reapplied once the filter returns
      ParCoords.highlightRow(-1);
      if (variables.length > 0) {
        buildNameHash(filteredData);
      }
    });
    /*jslint unparam: false */


    $scope.noHighlightAvailable = true;

    $scope.highlightRow = function () {
      // called by ng_change directive on the rowName input in the UI
      var highlightIndices = [],
        rowNames = [];

      if($scope.model.rowName) {
        rowNames = [$scope.model.rowName];
        if ($scope.model.rowName.indexOf(',') > -1) {
          rowNames = $scope.model.rowName.split(",")
        }
      }
      rowNames.forEach(function(n) {
        var rowName = n.trim();
        if (nameHash.hasOwnProperty(rowName)) {
          highlightIndices.push( nameHash[rowName]);
        }
      });


      ParCoords.highlightRow(highlightIndices);
    };

    $scope.selectHighlightName = function(name, event) {
     // if (!event.ctrlKey || $scope.model.rowName.length < 1) {
        $scope.model.rowName = name;
        $scope.highlightRow();
      // } else {
      //
      //   $scope.model.rowName =  $scope.model.rowName + "," + name;
      //   $scope.highlightRow();
      // }
      // if(!$scope.model.rowName.length) {
      //
      // }else {
      //   $scope.model.rowName.concat(", " + name)
      // }

    }
    if( DataSet.schema()){
      applySchemaInformation(DataSet.schema());
    }

    $scope.$on('DataSet::highlight', function (e, highlightNamesArray) {
      $scope.model.rowName = highlightNamesArray.join(",");
      //$scope.highlightRow()
      $scope.$apply(); // ensure that change propogates to UI
     // $scope.highlightRow();

      var highlightIndices = [],
        rowNames = [];

      if($scope.model.rowName) {
        rowNames = [$scope.model.rowName];
        if ($scope.model.rowName.indexOf(',') > -1) {
          rowNames = $scope.model.rowName.split(",")
        }
      }
      rowNames.forEach(function(n) {
        var rowName = n.trim();
        if (nameHash.hasOwnProperty(rowName)) {
          highlightIndices.push( nameHash[rowName]);
        }
      });


    });
  });
