/*jslint browser:true, unparam: true, indent: 2, nomen: true */
/*global angular, d3, $, _*/

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
  .controller('ParcoordsCtrl', function ($scope, $window, $element, DataSet, Analytics,Color, ParCoords,AppStatus) {

    'use strict';

    $scope.init=function(){
        DataSet.initData()
    };

    /// private Controller vars
    var d = {
      parcoords: d3.parcoords()($element[0]),
      currentHighlightRows: [],
      orderedVariables: [],
      renderingMonitoring: {
          startRendering:startRendering,
          stopRendering:stopRendering,
          setRemainingRenderingNb:setRemainingRenderingNb,
      },
    };
    function startRendering(action,rowsCount,withApply){
        AppStatus.setStatus("Rendering...")
        AppStatus.setParcoordRendering(action,true,rowsCount,withApply);
    }
    function setRemainingRenderingNb(action,nbRemaining,withApply){
        AppStatus.setStatus("Rendering...")
        AppStatus.setParcoordRemainingRenderingNb(action,nbRemaining,withApply);
    }
    function stopRendering(action,withApply){
        AppStatus.setStatus("");
        AppStatus.setParcoordRendering(action,false,null,withApply);
    }
      /// private controller functions
    function render() {
      // initialize brushed data to empty array
      if ($scope.brushed === undefined || $scope.brushed.length !== 0) {
        $scope.brushed = [];
        DataSet.brush($scope.brushed, "parcoords");
      }

      d.parcoords
        .brushReset()
        .autoscale()
        .updateAxes()
        .render();
    }

    function resize() {
      d.parcoords
        .width($element[0].clientWidth)
        .height($element[0].clientHeight)
        .resize();
      render();
      highlightRow(d.currentHighlightRows);

    }

    /*
     function transformBrushExtents() {
     var brushData = {extents: {}, categories: {}},
     b = null,
     getDomain = function (item, index) {
     if (item >= d.parcoords.brushExtents()[b][0] && item <= d.parcoords.brushExtents()[b][1]) {
     brushData.categories[b].push(d.parcoords.yscale[b].domain()[index]);
     }
     };

     for (b in d.parcoords.brushExtents()) {
     if (d.parcoords.brushExtents().hasOwnProperty(b)) {
     if (d.parcoords.types()[b] === "string") {
     brushData.categories[b] = [];
     d.parcoords.yscale[b].range().forEach(getDomain);
     } else {
     brushData.extents[b] = d.parcoords.brushExtents()[b];
     }
     }
     }
     return brushData;
     }
     */

    function setDimensions() {
      var dims = _.pluck(ParCoords.selectedVariables, "name"),
        types = {},
        averages = {},
        brushedData = d.parcoords.brushed(),
        dimensionsChanged;

      // orderedVariables take intersection with selectedVariables
      d.orderedVariables = _.filter(d.orderedVariables, function (variable) {
        return _.contains(dims, variable);
      });

      // add new variables to orderedVariables
      _.each(dims, function (variable) {
        if (!_.contains(d.orderedVariables, variable)) {
          d.orderedVariables.push(variable);
        }
      });

      // init types of selectedVariables
      _.each(ParCoords.selectedVariables, function (dim) {
        if (dim.type === "factor"||dim.type === "character") {
          types[dim.name] = "string";
        } else {
          types[dim.name] = "number";
        }
      });

      // check that orderedVariables are different from parcoords dimensions
      // We need to make sure that the scales for the dimensions we want are calculated,
      // since we need those scales in the next block of code.
      dimensionsChanged = d.orderedVariables.length !== d.parcoords.dimensions().length || d.orderedVariables.some(function (dimension) {
        return d.parcoords.dimensions().indexOf(dimension) === -1;
      });

      d.parcoords.dimensions(d.orderedVariables);

      // change types in parcoords
      if (dimensionsChanged) {
        d.parcoords
          .types(types)
          .autoscale()
          .updateAxes();
      }

      // sort variables by avg value
      if (ParCoords.variableSorting !== "none") {
        if (brushedData === false) {
          brushedData = d.parcoords.data();
        }
          // compute avg of values for numerical data or prominent category for categorical data
        _.each(d.orderedVariables, function (variable) {
          var catCounts = {},
            maxCategory,
            maxCount = 0;

          if (types[variable] === "string") {

            _.each(brushedData, function (row) {
              var category = row[variable];
              if (catCounts[category] === undefined) {
                catCounts[category] = 1;
              } else {
                catCounts[category] += 1;
              }

              if (catCounts[category] > maxCount) {
                maxCount=catCounts[category];
                maxCategory = category;
              }
            }); // end for each row
            averages[variable] = maxCategory;
          } else {
            averages[variable] = _.sum(brushedData, variable) / brushedData.length;

          }
        }); // end foreach variable
        d.parcoords.reorder(averages);
      } // end if ParCoords.variableSorting !== "none"
    }// end setDimensions()


    /// Initialization
    d.parcoords
      .setRenderingMonitoring(d.renderingMonitoring)
      .mode("queue")
      .brushedColor("black")
      .alphaOnBrushed(0.5)
      // rate is the nb of items to render for each display bloc in the queue
      //   .rate(250) // Increasing it reduce the time to render but interactions during rendering is less fluid.
      .rate(50) // Reducing it increases the time to render all items but interactions during rendering remain fluid.
      .alpha(0.05)
      .render()
      .createAxes()
      .brushMode("1D-axes-multi")
      .reorderable()
      .dimensionTitleRotation(-25)
      .on("brushend", function () {
        // NOTE: the brushend event from parcoords is "outside" angular, so we
        //       have to wrap it in $scope.$apply to make sure that other
        //       controllers are updated appropriately.
        $scope.$apply(function () {
          var brushed = d.parcoords.brushed();

          // d3.parcoords.js returns the full data set when no brush is set.
          // This can't be changed in the component for legacy reasons. However,
          // when no brushes are set, no data is brushed, so let's work around
          // this issue here.
          brushed = brushed.length === d.parcoords.data().length ? [] : brushed;
          DataSet.brush(brushed, "parcoords");

          if (ParCoords.variableSorting !== "none") {
            setDimensions();
            d.parcoords.render();
          }
        });
      })
      .on("axesreorder", function (variables) {
        d.orderedVariables = variables;
      });


    function updateSharedAxes() {
      var dims = _.pluck(ParCoords.sharedScaleVariables, "name"),
        domain;

      // First we determine the min/max required extents of the domain
      domain = _.reduce(dims, function (widest, variable) {
        var current = d.parcoords.yscale[variable].domain();
        return [
          Math.min(widest[0], current[0]),
          Math.max(widest[1], current[1])
        ];
      }, [Infinity, -Infinity]);

      // Next, we change the domain of the variables that have to share scale.
      _.each(dims, function (dim) {
        d.parcoords.scale(dim, domain);
      });
      d.parcoords
        .brushReset()
        .updateAxes()
        .render();
    }

    // function to be used as callback when data is requested
    function loadData(data) {
      AppStatus.setStatus("Processing data");
      setDimensions();
      d.parcoords.data(data);
      render();

      if (ParCoords.sharedScaleVariables.length > 0) {
        updateSharedAxes();
      }

      // if there is a row currently highlighted and it exists in the new dataset
      // we want to ensure it is still highlighted
      if (d.currentHighlightRows.length) {
        d.parcoords.highlight([d.parcoords.data()[d.currentHighlightRows]]);
      }
    }
    function invalidateRendering(){
        d.parcoords.render.invalidateQueue();
    }
    // function to be used as callback when new varaibles
    // are requested to be added on to existing data
    function loadAdditionalData(data) {
      setDimensions();
      d.parcoords.data().forEach(function (d, i) {
        _.forEach(data[i], function (val, key) {
          d[key] = val;
        });
      });
      render();
    }

    function highlightRow(itemIndices) {
      d.currentHighlightRows = itemIndices;
      if (d.currentHighlightRows.length > 0) {
        var dataItems = itemIndices.map(x => d.parcoords.data()[x] )
        d.parcoords.highlight(dataItems);
      } else {
        d.parcoords.unhighlight();
      }
    }
    // if(d.currentHighlightRows.length) {
    //   highlightRow(d.currentHighlightRows);
    // };

    angular.element($window).bind('resize', resize);
    $(document).ready(resize);

    /// Scope extensions
    // For some reason $scope.$watch(ParCoords.selectedVariables), doesn't
    // work. So for now, I'll fall back to the more reliable broadcast
    //meganism.

    var updateVariablesBasedOnSelection = function () {
      var dims = _.pluck(ParCoords.selectedVariables, "name"),
        newVariables = _.difference(dims, d.parcoords.dimensions()),
        missingVariables = _.difference(d.parcoords.dimensions(), dims),
        existingVariables = _.intersection(d.parcoords.dimensions(), dims);
      // Comparing variable names to existing variables and only requesting new ones

      if (existingVariables.length === 0) {
        AppStatus.setStatus("Getting data...");
        DataSet.get(dims, loadData);
      } else {
        if (newVariables.length > 0) {
          // AppStatus.setStatus("Getting additional data...");
          DataSet.get(newVariables, loadAdditionalData);
        } else if (missingVariables.length > 0 || ParCoords.variablesToUpdate.length !== 0) {
          if (ParCoords.variablesToUpdate.length !== 0) {
            DataSet.get(ParCoords.variablesToUpdate, loadAdditionalData);
          }
          setDimensions();
          render();
          ParCoords.variablesToUpdate = [];
        }
      }
    };

    $scope.$on("ParCoords::selectedVariablesChanged", updateVariablesBasedOnSelection);

    $scope.$on("ParCoords::brushedColorChanged", function (e, color) {
      /*jslint unparam:true*/
      d.parcoords.brushedColor(color);
      d.parcoords.renderBrushed();
    });

    $scope.$on("DataSet::brushed", function (ev, brushed, method) {
      if (method === "parcoords") {
        return;
      }

      d.parcoords.brushReset();

      if (brushed.length === 0) {
        brushed = d.parcoords.data();
      }
      d.parcoords.brushed(brushed);

      if (ParCoords.variableSorting !== "none") {
        setDimensions();
        d.parcoords.render();
      }

      d.parcoords.renderBrushed();
    });

    $scope.$on("ParCoords::variableSortingChanged", function () {
      setDimensions();
      d.parcoords.render();
    });

    $scope.$on("ParCoords::scaleSharingVariablesChanged", function () {
      if (ParCoords.sharedScaleVariables.length > 0) {
        updateSharedAxes();
      } else {
        d.parcoords
          .autoscale()
          .updateAxes()
          .render();
      }
    });

    $scope.$on("ParCoords::brushPredicateChanged", function () {
      var brushed = null;
      d.parcoords.brushPredicate(ParCoords.brushPredicate).renderBrushed();
      // need to reissue the brush command so that ESCGs are updated
      brushed = d.parcoords.brushed()
      brushed = brushed.length === d.parcoords.data().length ? [] : brushed;
      DataSet.brush(brushed, "parcoords");
    });

    $scope.$on("DataSet::dataLoaded", function (ev, data) {
      d.parcoords.data(data);
      render();
    });

    $scope.$on("DataSet::filtered", function (ev, filteredData) {
      loadData(filteredData);
    });
      $scope.$on("Data::InvalidateRendering", function (ev, data) {
          invalidateRendering();
      });


    function colorDataItems(colors) {

      function colorfn(d_item, i) {
        return colors.hasOwnProperty(d_item.row) ? colors[d_item.row] : "#000";
      }
      d.parcoords.color(colorfn);


    }
    $scope.$on("Colors::changed", function (e, colors) {

      colorDataItems(colors);
      render();
      if (ParCoords.sharedScaleVariables.length > 0) {
        updateSharedAxes();
      }

    });

    $scope.$on("Opacity::changed", function (e, opacity) {
      d.parcoords.alpha(opacity).render();
      if (ParCoords.sharedScaleVariables.length > 0) {
        updateSharedAxes();
      }
    });

    ParCoords.setHighlightFunction(highlightRow);
    if(DataSet.data().length) {
      //loadData(DataSet.data());
      angular.element(document).ready(function () {
        DataSet.refreshSchema(); // make sure all other controllers already knwo that data is loaded
        //updateVariablesBasedOnSelection();
        var dims = _.pluck(ParCoords.selectedVariables, "name");
        DataSet.get(dims, loadData);

        if (d.currentHighlightRows.length) {
          d.parcoords.highlight([d.parcoords.data()[d.currentHighlightRows]]);
        }

      });
    }
    if(Color.colorMap()) {
      colorDataItems(Color.colorMap())
    }


    // if there is a row currently highlighted and it exists in the new dataset
    // we want to ensure it is still highlighted
   // ParCoords.highlightRow();

      console.log("parcoordsctrl.js initialized");
  });
