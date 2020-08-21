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
/**************************************
 * similarityconfigctrl.js
 * Functionality: Similarity search copnfiguratuib
 *
 * Created By : Nicolas Medoc (LIST)
 * Date: 12/05/2020
 ********************************/
angular.module('LAMDAClientApp.controllers')
  .controller('SimilarityConfigCtrl', function ($scope, $modalInstance, options, DataSet) {

    'use strict';

    // It is possible that there are less than 30 individuals, in which case we can not search more than 10 neighbors.
    // The default number neighbors in this case is less than the number of rows as it would otherwise,
    // make no sense.
    var dataset=DataSet.data();
    var previousNeighborsCount = Math.min(30, Math.floor(Math.sqrt(dataset.length)));
    function updateControllerState() {
      // create identifier for the new column name
      // $scope.specified.identifier = $scope.specified.method.name
      //   + ($scope.specified.centers !== -1 ? '_' + $scope.specified.centers : "")
      //   + '_' + ($scope.specified.variables.length || 0);
      // check configuraiton
      $scope.configurationInvalid =
        ($scope.specified.k < 2 && $scope.specified.k !== -1)
        || $scope.specified.variables.length < 1;
    }

    $scope.options = options;
    $scope.configurationInvalid = true;

    $scope.specified = {
      method: $scope.options.methods[0],
      metric: $scope.options.methods[0].args.metrics[0],
      rowId:  $scope.options.rowId, //dataset[0].row, //($scope.options.methods[0]?$scope.options.methods[0].name:"NoClusteringMethodsFound") + '_' + previousNeighborsCount + '_0',
      k: previousNeighborsCount, // NOTE: The naming is kmeans specific
      variables: []
    };

    $scope.$watch('specified.metric', updateControllerState);
    $scope.$watch('specified.k', updateControllerState);
    $scope.$watch('specified.variables', updateControllerState);
    $scope.$watch('specified.method', updateControllerState);

    $scope.ok = function () {
      $modalInstance.close($scope.specified);
    };

    $scope.hideCenters = function () {
      if ($scope.specified.method.name !== "KNN" ) {
        previousNeighborsCount = $scope.specified.k;
        $scope.specified.k = -1;
        return true;
      }
      if ($scope.specified.k === -1) {
        $scope.specified.k = previousNeighborsCount;
      }
      return false;
    };

    $scope.cancel = function () {
      $modalInstance.dismiss();
    };
  });
