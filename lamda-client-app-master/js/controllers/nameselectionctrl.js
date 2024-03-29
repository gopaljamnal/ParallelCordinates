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
  .controller('NameSelectionCtrl', function ($scope, $modalInstance, selectedName) {

    'use strict';

    // https://stackoverflow.com
    //   /questions/21379173/angularjs-ui-modal-and-select-doesnt-update-the-scope-values
    $scope.data = {
      selectedName: "",
      placeholderName: selectedName
    };

    $scope.ok = function () {
      if ($scope.data.selectedName === "") {
        $scope.data.selectedName = $scope.data.placeholderName;
      }
      $modalInstance.close($scope.data.selectedName);
    };

    $scope.cancel = function () {
      $modalInstance.dismiss();
    };
  });
