/*jslint indent: 2, white: false, nomen: true */
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

angular.module('LAMDAClientApp.services')
  .service('Color', function ($rootScope, DataSet, R) {

    'use strict';
    var quantileSize=10; // was 10 but use 8 to avoid too extreme dark (black burshed not visible) and light colors (lines not visible with white background)
    var defaultColor="#069"
    var d = {
        dataSchema: undefined,
        coloring: {
          schemeName: undefined,
          scheme: undefined,
          method: undefined,
          colorFn: undefined,
          variable: undefined,
          rows:undefined //mapping for row to color by  row field
        },
        schemes: {
          numeric: {
            value: {
              // different yellows: "#fff7bc", "#FCDB0D"
              Yellow_to_Red: ["#fffb95",d3.colorbrewer.Reds[9][7]],
              Red_to_Blue: [d3.colorbrewer.Reds[9][7], defaultColor],
              Yellow_to_Brown:["#fffb95",d3.colorbrewer.YlOrBr[9][7]],
              Yellow_to_Orange:["#fffb95",d3.colorbrewer.Oranges[9][7]],
              Yellow_to_Green: ["#fffb95",d3.colorbrewer.YlGn[10][8]],
              // Yellow_to_Green: ["#FCDB0D",d3.colorbrewer.YlGn[10][6]],
              // Yellow_Blue: ["#FCDB0D",d3.colorbrewer.YlGnBu[9][7]]
              Yellow_Blue: ["#fffb95",defaultColor], // fff7bc
              Yellow_Blue2:["#fffb95",d3.colorbrewer.YlGnBu[9][7]],
              Blue_to_Brown: [defaultColor, d3.colorbrewer.Reds[9][7]],
              // Blue_to_Brown: [defaultColor, d3.colorbrewer.YlOrBr[9][7]],
              // Blue_to_Brown: ["steelblue", "brown"],
              // Blue_to_Yellow: ["blue", "yellow"],
              // cool: ["#00FFFF", "magenta"]
            },
            decile: {
              // To remove extremes: yellow_to_red: d3.colorbrewer.YlOrRd[10].slice(1,quantileSize-1),
              Yellow_Or_Red: d3.colorbrewer.YlOrRd[10],
              Yellow_Green_Blue: ['#ffffd9','#edf8b1','#c7e9b4','#7fcdbb','#41b6c4','#41b6c4','#1d91c0','#225ea8','#253494','#081d58'], // d3.colorbrewer.YlGnBu[9], //
              Red_to_Purple: ["#fff7f3","#fde0dd","#fcc5c0","#fa9fb5","#f768a1","#f768a1","#dd3497","#ae017e","#7a0177","#49006a"], //d3.colorbrewer.RdPu[9], //
              Yellow_to_Green: d3.colorbrewer.YlGn[10],
              Yellow_Or_Brown: ["#ffffe5","#fff7bc","#fee391","#fec44f","#fe9929","#fe9929","#ec7014","#cc4c02","#993404","#662506"], //d3.colorbrewer.YlOrBr[9], //
              Blue_to_Green: d3.colorbrewer.BuGn[10],
              Blue_to_Purple: d3.colorbrewer.BuPu[10],
              Blues: d3.colorbrewer.Blues[10],
              Reds: ["#fff5f0","#fee0d2","#fcbba1","#fc9272","#fb6a4a","#fb6a4a","#ef3b2c","#cb181d","#a50f15","#67000d"], //d3.colorbrewer.Reds[9], //
              Oranges: ["#fff5eb","#fee6ce","#fdd0a2","#fdae6b","#fd8d3c","#fd8d3c","#f16913","#d94801","#a63603","#7f2704"], //d3.colorbrewer.Oranges[9], //
            }
          },
          factor: {
            value: {
              "Dark2 (8 colors)": d3.colorbrewer.Dark2[8],
              "Set1 (9 colors)": d3.colorbrewer.Set1[9],
              "Category (10 colors)": d3.scale.category10().range(),
              "Paired (12 colors)": d3.colorbrewer.Paired[12],
              "Yellow_Red (10 colors)": d3.colorbrewer.YlOrRd[10],
              "Set3 (12 colors)": d3.colorbrewer.Set3[12],
              "Category A (20 colors)": d3.scale.category20().range(),
              "Category B (20 colors)": d3.scale.category20b().range(),
              "Category C (20 colors)": d3.scale.category20c().range(),
              "Red_Yellow_Blue (11 colors)": d3.colorbrewer.RdYlBu[11],
              // the qualitiative set will calulate the number of clusters before application
              // qualitative_set: [] //rainbow_hcl(30, c = 50, l = 70, start = 0, end = 360*(30-1)/30)
            }
          }
        }
      },
      cfg = {
        numeric: {
          Value: _.keys(d.schemes.numeric.value),
          Decile: _.keys(d.schemes.numeric.decile)
          //"Z-score" = c("RedToBlue", "Spectral")
        },
        factor: {
          Value: _.keys(d.schemes.factor.value)
        }
      };

    function variableType(variable) {
      return _.result(_.find(d.dataSchema, { name: variable }), 'type');
    }

    function colorFactorValue(colorVariable, colorScheme) {
      DataSet.get([colorVariable], function (data) {
        var domain = _.pluck(_.uniq(data, colorVariable), colorVariable);
        d.coloring.rows = {};

        d.coloring.colorFn = d3.scale.ordinal();
        d.coloring.colorFn
          .domain(domain)
          .range(d.schemes.factor.value[colorScheme]);

        _.each(data, function (datum) {
          d.coloring.rows[datum.row] = d.coloring.colorFn(datum[colorVariable]);
        });

        d.coloring.scheme = d.schemes.factor.value[colorScheme];
        $rootScope.$broadcast("Colors::changed", d.coloring.rows);
      });
    }

    function colorNumericValue(colorVariable, colorScheme) {
      DataSet.get([colorVariable], function (data) {
        var domain = d3.extent(data, function (datum) { return datum[colorVariable]; });
        d.coloring.rows = {};

        d.coloring.colorFn = d3.scale.linear();
        d.coloring.colorFn
          .domain(domain)
          .range(d.schemes.numeric.value[colorScheme])
          .interpolate(d3.interpolateLab);

        _.each(data, function (datum) {
          d.coloring.rows[datum.row] = d.coloring.colorFn(datum[colorVariable]);
        });

        d.coloring.scheme = d.schemes.numeric.value[colorScheme];
        $rootScope.$broadcast("Colors::changed", d.coloring.rows);
      });
    }

    // Puts percent (given by quantileSize) of the data items, ordered by color variabel in the same
    // bin.
    function colorNumericDecile(colorVariable, colorScheme) {
      DataSet.get([colorVariable], function (data) {
        var binSize = Math.round(data.length / quantileSize),
          currentBin = 0,
          currentBinSize = 0,
          lastValue,
          colorStepValues = [];
        d.coloring.rows = {};

        data.sort(function (a, b) {
          return +a[colorVariable] - +b[colorVariable];
        });

        colorScheme = d.schemes.numeric.decile[colorScheme];

        _.each(data, function (row) {
          var value = row[colorVariable];

          if (currentBinSize >= binSize && currentBin < quantileSize-1 && value !== lastValue) {
            currentBin = currentBin + 1;
            currentBinSize = 0;

            colorStepValues.push((value + lastValue) / 2);
          }

          currentBinSize = currentBinSize + 1;
          lastValue = value;

          d.coloring.rows[row.row] = colorScheme[currentBin];
        });

        d.coloring.colorFn = function (value) {
          var bin = 0;

          _.each(colorStepValues, function (stepValue) {
            if (value > stepValue) {
              bin += 1;
            } else {
              return;
            }
          });

          return colorScheme[bin];
        };

        d.coloring.scheme = d.schemes.numeric.decile[colorScheme];
        $rootScope.$broadcast("Colors::changed", d.coloring.rows);
      });
    }

    function colorNumeric(colorVariable, colorMethod, colorScheme) {
      switch (colorMethod) {
      case "Value":
        colorNumericValue(colorVariable, colorScheme);
        break;
      case "Decile":
        colorNumericDecile(colorVariable, colorScheme);
        break;
      case "Z-score":
        break;
      default:
        throw "Unsupported color method:" + colorMethod;
      }
    }

    function colorFactor(colorVariable, colorMethod, colorScheme) {
      switch (colorMethod) {
      case "Value":
        colorFactorValue(colorVariable, colorScheme);
        break;
      default:
        throw "Unsupported color method:" + colorMethod;
      }
    }

    function colorManual(colorScheme) {
      var data = DataSet.data(),
        rowColors = {};

      d.coloring.colorFn = function () {
        return "steelblue";
      };

      _.forEach(data, function (row) {
        rowColors[row.row] = "steelblue";
      });
      d.coloring.scheme = d.schemes.factor.value[colorScheme];

      DataSet.addVariable("Manual selection", rowColors, "factor", "Colors", "steelblue");

      $rootScope.$broadcast("Colors::changed", rowColors);
    }

    function color(variable, colorMethod, colorScheme) {
      var type = variableType(variable);
      d.coloring.variable = variable;
      d.coloring.method = colorMethod;
      d.coloring.schemeName = colorScheme;

      if (R.is.factor(type)) {
        if (variable === "Manual selection") {
          colorManual(colorScheme);
        } else {
          colorFactor(variable, colorMethod, colorScheme);
        }
      } else if (R.is.numeric(type)) {
        colorNumeric(variable, colorMethod, colorScheme);
      } else {
        throw type + " is an unsupported data type";
      }
    }

    /*jslint unparam: true */
    $rootScope.$on("DataSet::schemaLoaded", function (ev, schema) {
      d.dataSchema = schema;
    });
    /*jslint unparam: false */

    $rootScope.$on('DataSet::analyticsUpdated', function (e, analyticsSchema) {
      /*jslint unparam:true*/
      if (analyticsSchema.type !== "numeric" && d.coloring.variable === undefined) {
        return; // We do not want automatic colouring on clustering
      }

      if (d.coloring.variable === undefined) {
        d.coloring.method = "Value";
        d.coloring.schemeName = "blue_to_brown";
      }

      if (d.coloring.variable === undefined || d.coloring.variable === analyticsSchema.name) {

        color(analyticsSchema.name, d.coloring.method, d.coloring.schemeName);
      }
    });

    // initially used to handle Manual selection disabled due to double data load/rendering
    // $rootScope.$on("DataSet::initialDataLoaded", function () {
    //   DataSet.addVariable("Manual selection", {}, "factor", "Colors", "steelblue");
    // });

    return {
      configuration: function () {
        return cfg;
      },

      color: color,

      colorScheme: function () {
        return d.coloring.scheme;
      },

      colorSchemeName: function () {
        return d.coloring.schemeName;
      },

      colorMethod: function () {
        return d.coloring.method;
      },

      colorFn: function () {
        return d.coloring.colorFn;
      },

      colorVariable: function () {
        return d.coloring.variable;
      },

      colorBrushed: function (color) {
        var rowColors = {};
        // FIXME: get value from DataSet.get (!!! nomally synchronous because normaly already added in DataSet.data.fulll)
        DataSet.get(["Manual selection"], function (rows) {
          _.forEach(rows, function (row) {
            rowColors[row.row] = row["Manual selection"];
          });
        });

        // FIXME: Normally the following code erase the previous initialization with color parameter (excepted if rows are different ?)
        _.forEach(DataSet.brushed(), function (row) {
          rowColors[row.row] = color;
        });

        d.coloring.variable = "Manual selection";
        d.coloring.colorFn = function (colorVal) {
          return colorVal; // The values of this variable are actually colors
        };

        // add (or update ?) "Manual selection" variable
        DataSet.addVariable("Manual selection", rowColors, "factor", "Colors", "steelblue");

        $rootScope.$broadcast("Colors::changed", rowColors);
      },

      opacity: function (value) {
        $rootScope.$broadcast("Opacity::changed", value);
      },
      colorMap: function() {
        return d.coloring.rows;
      }
    };
  });
