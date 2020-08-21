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
 * attributeBarChartDirective.js
 * Functionality: Builds an interactive barchart using vega-lite
 *                Inputs include. Can take in Height and width of barchart as parameters
 *                as well as the field to use as the X-axis labels
 *
 * Created By : Fintan McGee (LIST)
 * Date: 17/11/2016
 ********************************/


/*global vegaEmbed */
angular.module('LAMDAClientApp.directives')
  .directive('summaryChartDirective', [
    function (  ) {
      "use strict";
      return {
        restrict: 'E',
        replace: true,
        template: '<div class ="centeredDiv"></div>',
        // controller:"ApplicationCtrl",
        // defining a JSDoc object
        // not for documentation purposes , but just to avoid webstorm reporting
        // on an unresolved variable
        /**
         * @param scope angular scope variable
         * @param element the element this directive is being attached to
         * @param params          parameters from HTML template/ partial.
         * @param params.givenid   a unique Id passed in form html
         * @param params.width  used to scale the view width
         * @param params.height  used to scale the view height
         * @param params.labelfield  used to specify which field is the label
         * */
        link: function (scope, element, params) {
          var labelIdMap = {};
          var chartWidth = null;
          var selectedLabelField = scope.model.selectedLabelField;
          var barChartAttributeGroup = scope.model.barChartAttributeGroup;
          var barChartAttribute = scope.model.barChartAttribute;
          var targetTagId = "summaryVis";
          if(params !== undefined && params.width !== undefined) {
            chartWidth = parseInt(params.width);
          }

          var chartHeight = null;
          if(params !== undefined && params.height !== undefined) {
            chartHeight = parseInt(params.height);
          }
          if(params !== undefined && params.labelfield !== undefined) {
            selectedLabelField = params.labelfield;
          }
          if(params !== undefined && params.attributefield !== undefined) {
            barChartAttribute = params.attributefield;
          }
          if(params !== undefined && params.attributegroupfield !== undefined) {
            // scope.model.selectedLabelField = params.labelfield;
            barChartAttributeGroup =  params.attributegroupfield;
          }
          if(params !== undefined && params.divid !== undefined) {
            // scope.model.selectedLabelField = params.labelfield;
            targetTagId = params.divid
          }



          var createChart = function() {

            var barData = scope.getSummaryChartData();

            if(barData.length) {
              if (selectedLabelField !== "RUN_ID") {
                labelIdMap = {};
                barData.forEach(function (n) {
                  if (labelIdMap.hasOwnProperty(n[selectedLabelField])) {
                    // some times labels may be duplicates , so we add a suffix to distinguish them
                    // and maintain correct mapping
                    n[selectedLabelField] = "" + n[selectedLabelField] + "_" +n.RUN_ID;
                  }

                  labelIdMap[n[selectedLabelField]] = n.uid;
                });
              }
              // defining a skeleton vega lite specification
              // the visualization is built by vega lite based on this
              var vlData = {
                "$schema": "https://vega.github.io/schema/vega-lite/v3.json",
                //"height": 200,
                "data": {
                  "name": "barData",
                  "values": barData
                },
                "mark": "boxplot",
                // "selection": {
                //   "brush": {"type": "interval", "encodings": ["x"]}
                // },
                "encoding": {
                  "x": {"field": barChartAttributeGroup, "type": "ordinal","axis":{"title":barChartAttributeGroup}},
                  "y": {"field": barChartAttribute, "type": "quantitative","axis":{"title":barChartAttribute}},

                }
              };
             /* if(chartHeight !== null) {
                vlData.height = chartHeight;
              }
              if(chartWidth !== null) {
                vlData.width = chartWidth;
              }*/
              var vegaView = null;


              /**************************************3
               * handleBrush
               * Functionality: Gets brushed element information from vega lite chart when the brush is updated
               *                Items are identified by x axis label so if that is not "id" a look up is done
               *
               * Created By : Fintan McGee (LIST)
               * Date: 17/11/2016
               * // controller:"ApplicationCtrl",
               // defining a JSDoc object
               // not for documentation purposes , but just to avoid webstorm reporting
               // on an unresolved variable

               * @param evt the brush event
               * @param data data associate wth the event
               * @param data.intervals  the intervals selected by the brush
               *
               ********************************/

            /*  var handleBrush = function (evt, data) {

                if (data) {
                  var ids = data.intervals[0].extent;
                  if(ids.length >3 ) {
                    console.log(JSON.stringify(data));
                  }
                  if (scope.model.selectedLabelField !== "uid") {
                    // map labels to node IDs
                    var originalIds = [];
                    ids.forEach(function (n) {
                      originalIds.push(labelIdMap[n]);
                    });
                    ids = originalIds;
                  }
                  // just use the ids

                  if (scope.replaceNodesSelection ) {
                    //we have ids now we build an array of actual nodes form the currently
                    // selected actual node items
                    // and pass it the relevant function in the application controller
                    scope.replaceNodesSelection(scope.convertIdsToActualNodes(ids),false,scope.model.selectAcrossAllLayers);
                  }
                }
              };
*/

              // embed the chart in the page
              vegaEmbed("#"  + targetTagId, vlData, {
                actions: false,
                renderer: "canvas"
              }).then(function (data1) {
                vegaView = data1.view;
                vegaView.hover().run(); // .enable hover event processing
                // add a listener to  identify brushed items
                // noinspection Annotator
                //vegaView.addSignalListener("brush_tuple", handleBrush);

              });
            }
          };

          // update the barchart when configuration changes
          // scope.$watch('model.barChartAttribute', function() {
          //   createChart();
          // });
          // scope.$watch('model.selectedSortOrder', function() {
          //   createChart();
          // });
          // scope.$watch('model.selectedLayer', function() {
          //   createChart();
          // });

          //to do add this code
          createChart();

        }
      };
    }]);