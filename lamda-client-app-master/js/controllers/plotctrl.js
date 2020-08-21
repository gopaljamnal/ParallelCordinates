/*jslint indent: 2, nomen: true */
/*global angular, _, d3 */

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
  .controller('PlotCtrl', function ($scope, DimRedPlot,AppStatus) {

    'use strict';

    $scope.analyses = [];

    $scope.dimredplotWidth = "col-lg-12";

    $scope.hideOptions = false;

    $scope.sliding = {"left": 0};

    function switchOptions() {
      if ($scope.hideOptions) {
        $scope.sliding = {"transform": "translate(0,0)"};
        $scope.hideOptions = false;
      } else {
        $scope.sliding = {"transform": "translate(-90%, 0)"};
        $scope.hideOptions = true;
      }
    }

    $scope.switchOptions = function () {
      switchOptions();
    };

    $scope.removeAnalysis = function (analysisMethodName) {
      var index = _.findIndex($scope.analyses, {'method': analysisMethodName});
      $scope.analyses.splice(index, 1);
    }
    // Makes sure that the labels of points are no longer than 80px
    function createWrappedLabels(points) {
      var testText = d3.select("body").append("div").style("float", "left");

      testText.style("font-size", "8px");

      function wrap(d, i) {
        /*jslint unparam:true*/
        var textLength,
          string,
          desiredStringLength,
          label = d.id;

        // if (d.label !== undefined) {
        //   label = d.label;
        // }
        //
        // testText.text(label);
        // textLength = testText.node().offsetWidth;

        string = label;
        // desiredStringLength = Math.ceil(80 / textLength * string.length);
        //
        // string = string.slice(0, desiredStringLength);
        // testText.text(string);
        // textLength = testText.node().clientWidth;
        //
        // while (textLength > 80 && string.length > 0) {
        //   string = string.slice(0, -1);
        //   testText.text(string);
        //   textLength = testText.node().clientWidth;
        // }

        d.wrappedLabel = string;
      }

      points.forEach(wrap);

      testText.remove();
    }

    function updatePlot(data) {
      //$scope.$apply(function () {
        var index;

        DimRedPlot.addProcessedData(data.method[0], data.processedData);

        if (data.variableProjections !== undefined) {
          createWrappedLabels(data.variableProjections);
        }
        if (data.individualProjections !== undefined) {
          createWrappedLabels(data.individualProjections);
        }

        index = _.findIndex($scope.analyses, {'method': data.method});

        if (index === -1) {
          data.plotIdx = $scope.analyses.length;
          $scope.analyses.push(data);
        } else {
          data.plotIdx = index;
          $scope.analyses[index] = data;
        }

        $scope.dimredplotWidth = "col-lg-" + (12 / $scope.analyses.length);

        if ($scope.analyses.length > 1) {
          if (!$scope.hideOptions) {
            switchOptions();
          }
        }
      //});
      AppStatus.setStatus("Dimensionality reduction ready for display !")
      $scope.$broadcast("DimRedPlot::resize", $scope.analyses.length);
    }

    $scope.$on("Analytics::dimensionalityReduced", function (ev, method, DRResponse) {
      /*jslint unparam: true */
      //session.getObject(updatePlot);
      updatePlot(DRResponse)
    });
  });
