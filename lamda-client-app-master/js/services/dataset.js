/*jslint todo:true, nomen: true, white: false, indent: 2, unparam: true */
/*global angular, _, ocpu*/

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
  .service('DataSet', function ($rootScope, $http, assert, OpenCPU,AppStatus) {

    'use strict';

    var d = {
        id: undefined, // TODO: handle "id" vs "row" correctly
        idField: undefined,
        datasetInfo:undefined,
        data: undefined,
        brushed: [],
        backend: {
          schema: undefined,
          schemaIndex: undefined,
          rows: undefined,
          analytics: {
            clusterings: {},
            summaries: {}
          }
        }
      };

    var useNodeServer = true;

    function updateSchema(schema) {
      d.backend.schema = schema;
     // TODO: handle "id" vs "row" correctly
     var idFields = schema.filter(d => d.group==="Id");
     if(idFields.length) {
       d.idField = idFields[0].name;
     }else if( schema.length) {

       d.idField = schema[0].name;
     } else {
       console.log("Empty schema returned");
     }

      // This adds a property that determines whether the variable is analysable in the R backend. This is necessary
      // because some variables are only calculated in the Javascript.
      _.forEach(d.backend.schema, function (variable) {
        variable.analysable = true;
      });

      d.backend.schemaIndex = _.indexBy(schema, 'name');
      $rootScope.$broadcast("DataSet::schemaLoaded", schema);
    }

    // Initialize the application as soon as the Dataset service is initialized and receive
    // the required information to configure and further bootstrap the front end.
    //TODO fix race condition bug with  angular.element(document).ready(function ()...
    function initData() {
        if (useNodeServer) {

            OpenCPU.nodeJson("app.init", {timestamp: Date.now()}, function (session, cfg) {
                //OpenCPU.nodeOpenCPUJson("app.init", {timestamp: Date.now()}, function (session, cfg) {
                d.data = cfg.data;
                updateSchema(cfg.data.schema);
                $rootScope.$broadcast("App::configurationLoaded", cfg);
            });

        } else {
            //assuming file exists on server
            OpenCPU.d3Json("app.init", {timestamp: Date.now()}, function (session, cfg) {
                d.data = cfg.data;
                updateSchema(cfg.data.schema);
                $rootScope.$broadcast("App::configurationLoaded", cfg);
            });
        }
    }
    // FIXME: call initData From a controller initialization (in a init method called from ng-init)
    // initData(); // by default it use configuration file

    $rootScope.$on("ParCoords::brushPredicateChanged", function (ev, predicate) {
      d.brushPredicate = predicate;
    });

    function addVariable(name, rows, type, group, missingReplacement) {
      var variableSchema = {name: name, type: type, group: group, group_type: group, analysable: false},
        rowArray = [],
        value,
        newVariable = false;

      if (d.backend.schemaIndex[name] === undefined) {
        d.backend.schema.push(variableSchema);
        d.backend.schemaIndex[name] = variableSchema;
        newVariable = true;
      }

      d.data.full.forEach(function (datum, idx) {
        d.data.full[idx][name] = rows[datum.row];
      });
      if (d.data.filtered !== undefined) {
        d.data.filtered.forEach(function (datum, idx) {
          d.data.filtered[idx][name] = rows[datum.row];
        });
      }

      if (newVariable) {
        $rootScope.$broadcast('DataSet::schemaLoaded', d.backend.schema);
      }
      if (group === "Analytics") {
        $rootScope.$broadcast('DataSet::analyticsUpdated', variableSchema);
      }

      // Tags need to be added to the actual database
      // Preferably, R should get a function addVariable and the DataSet should not have to care what
      // the group is of the variable we want to add. This would however require some extra work in R.
      if (group === "Tags") {
        _.each(d.data.full, function (row) {
          value = rows[row.row];
          if (value === undefined) {
            value = missingReplacement;
          }

          rowArray.push(value);
        });

        OpenCPU.nodeJson("data.addTag", {timestamp: Date.now(), name: name, data: rowArray}, ()=>console.log("Tag  added to back end"));
      }

      return variableSchema;
    }

    function removeVariable(name) {
      var variableIdx = _.findIndex(d.backend.schema, "name", name),
        group;

      if (variableIdx === -1) {
        return;
      }

      group = d.backend.schema[variableIdx].group;
      d.backend.schema.splice(variableIdx, 1);
      delete d.backend.schemaIndex[name];
      $rootScope.$broadcast('DataSet::schemaLoaded', d.backend.schema);

      if (group === "Tags") {
        OpenCPU.nodeJson("data.removeTag", {timestamp: Date.now(), name: name});
      }
    }

    function getDatasetList(cb){
      OpenCPU.nodeJson("data.getDatasetList", {timestamp: Date.now()},function(session,datasetList){
        cb(datasetList);
        $rootScope.$broadcast('DataSet::datasetListLoaded',datasetList)
      });
    }
      function getCurrentDatasetInfo(cb){
        if(d.datasetInfo){
            cb(d.datasetInfo);
        }else {
            OpenCPU.nodeJson("data.getCurrentDatasetInfo", {timestamp: Date.now()}, function (session, dataset) {
                cb(dataset);
                // $rootScope.$broadcast('DataSet::datasetListLoaded',datasetList)
            });
        }
      }
    function sendDatasetFile(data,cb){
      OpenCPU.nodeUploadFile("data.sendDatasetFile",data, function(session,response){
        cb(response);// response is schema data
      });
    }

    function getSchemaForDataset(data,cb){
      OpenCPU.nodeJson("data.getSchemaForDataset",data, function(session,response){
        cb(response);
      });
    }

    // Listen to the analytics service to store the results of various
    // analytical actions.
    $rootScope.$on("Analytics::dataUpdated", function (ev, identifier) {
      if (!d.backend.schemaIndex.hasOwnProperty(identifier)) {
        // We send the current timestamp as arg to avoid caching to happen here
      //  nodeOpenCPUJson
      //  OpenCPU.json("data.schema", {timestamp: Date.now()}, function (session, schema) {
        OpenCPU.nodeJson("data.schema", {timestamp: Date.now()}, function (session, schema) {
          updateSchema(schema);
          AppStatus.setStatus("Analytic processing done ! ");
          $rootScope.$broadcast("DataSet::analyticsUpdated", d.backend.schemaIndex[identifier]);
        });
      } else {
        $rootScope.$broadcast("DataSet::analyticsUpdated", d.backend.schemaIndex[identifier]);
      }
    });

      // Listen to the analytics service brush the results of various
      // analytical actions.
      $rootScope.$on("Analytics::similarityRetrieved", function (ev, neighborRows) {
          // We want to brush rows
          const neighborRowItems=neighborRows.map((neighborRow)=>{
              const index = d.data.full.index[neighborRow.row];
              const dataItem = d.data.full[index];
              return dataItem;
          });
          AppStatus.setStatus("Similarity result ready for display ! ")
          changeBrushed(neighborRowItems,"similarity")
      });


      function processReceivedData(data) {
      d.data.filtered = undefined; // Reset filtered data.

      if (d.data.full === undefined) {
        d.data.full = data;
        d.data.full.index = {};
        _.each(data, function (datum, i) {
          d.data.full.index[datum.row] = i;
        });
        $rootScope.$broadcast("DataSet::initialDataLoaded");
      } else {
        // For each item we retrieved add or update if already exists
        _.each(data, function (datum) {
          // If the item doesn't exist yet in the full data set, we'll have to
          // add it.
          if (d.data.full.index[datum.row] === undefined) {
            d.data.full.index[datum.row] = d.data.full.length;
            d.data.full.push(datum);
          }

          // Update the item in the full data set.
          var index = d.data.full.index[datum.row],
            dataItem = d.data.full[index],
            keys = _.keys(datum);

          _.each(keys, function (key) {
            dataItem[key] = datum[key];
          });

          d.data.full[index] = dataItem; // Not sure if this is required
        });
      }
    }

    function dataFiltered() {
      return d.backend.rows !== undefined && d.backend.rows.length > 0;
    }

    function filterData() {
      if (!dataFiltered) { throw "Trying to filter unfiltered data."; }

      var filtered = d.data.filtered || [];

      // Recreate the filtered set of rows
      if(d.data.full&&d.data.full.length>0) {
          _.each(d.backend.rows, function (row) {
              var index = d.data.full.index[row];
              filtered.push(d.data.full[index]);
          });
      }
      return filtered;
    }

    function currentDataSet(forceFullDataset) {
      if ((!forceFullDataset) && dataFiltered()) {
        if (!d.data.filtered) { d.data.filtered = filterData(); }
        return d.data.filtered.slice();
      }

      if (d.data !== undefined && d.data.full !== undefined) {
        return d.data.full.slice();
      }
      return [];
    }

    function changeBrushed(rows, method) {
      d.brushed = rows;
      $rootScope.$broadcast("DataSet::brushed", rows, method);
    }
    console.log("dataset.js initialized");

    return {
      FilterMethod: { KEEP: 'KEEP', REMOVE: 'REMOVE', RESET: 'RESET' },

      /**
       * Returns the row ids of the currently filtered rows or undefined if no
       * filtering was applied (meaning all rows will loaded when using get).
       */
      rows: function () {
        return d.backend.rows;
      },
      idField : function() {return d.idField},

      /**
       * Returns the full data set as it is currently loaded, this takes filtering into account.
       */
      data: currentDataSet,

      schema: function () {
        if(!d.backend.schema) {
          return null;
        }
        return d.backend.schema.slice();
      },

      brushed: function () {
        if (d.brushed === undefined) {
          return [];
        }
        return d.brushed;
      },

      addVariable: addVariable,

      removeVariable: removeVariable,

      getDatasetList:getDatasetList,
      getCurrentDatasetInfo:getCurrentDatasetInfo,
      sendDatasetFile:sendDatasetFile,
      getSchemaForDataset:getSchemaForDataset,
      // Returns from the server the data values for given variables.
      // @param variables - a list of strings, containing the names of the
      //                    variables to be loaded.
      // @param callback -  a function to be executed once data has been successfully loaded
      get: function (variables, callback) {
        var args = {},
          availableVariables;

        // TODO: Create a unique id for each requests. When a new request comes
        //       in, check if there is an ongoing requests which encompasses all
        //       variables in the new request. If so, add the callback to the
        //       list of callbacks for this request. Otherwise, remove already
        //       requested variables from the list (they will come in with the
        //       ongoing request) and place a new request with the remaining
        //       variables. The callback is called only when the remaining
        //       variables are loaded.
        // @see _.uniqueId

        // check if new variables to request...
        if (d.data.full !== undefined && d.data.full.length > 0) {
          availableVariables = _.keys(d.data.full[0]);
          variables = _.difference(variables, availableVariables);
        }

        // get new variables if necessary.
        if (variables.length > 0) {
          args.variables = variables;
          // Always get the full column to avoid synchronization problems
          // related to filtering
          //args.rows = d.backend.rows;
          if(useNodeServer) {

           // nodeJson
            // temproar test of node data  call back funcitonality
           // OpenCPU.nodeOpenCPUJson("data.get", args, function (session, data) {
            AppStatus.setDataLoading(true);
            OpenCPU.nodeJson("data.get", args, function (session, data) {
                AppStatus.setDataLoading(false);
                processReceivedData(data);
              callback(currentDataSet());
            });
          } else {
            AppStatus.setDataLoading(true);
            OpenCPU.d3Json("data.get", args, function (session, data) {
              AppStatus.setDataLoading(false);
              processReceivedData(data);
              callback(currentDataSet());
            });
          }
        } else {
          // All variables are alread there, just directly return the data.
          callback(currentDataSet());
        }
      },

      filter: function (filterMethod) {
        if (filterMethod === this.FilterMethod.RESET) {
          d.backend.rows = undefined;
          $rootScope.$broadcast("DataSet::filtered", currentDataSet());
          return;
        }

        if (d.brushed.length === 0) { throw "ERROR, filtering while nothing is brushed"; }

        if (filterMethod === this.FilterMethod.KEEP) {
          d.backend.rows = _.pluck(d.brushed, "row");
        } else {
          var toRemove = _.indexBy(_.pluck(d.brushed, "row"));

          d.backend.rows = d.backend.rows || _.pluck(d.data.full, "row");
          d.backend.rows = _.filter(d.backend.rows, function (d) {
            return toRemove[d] === undefined;
          });
        }

        changeBrushed([], "filter");
        d.data.filtered = undefined;
        $rootScope.$broadcast("DataSet::filtered", currentDataSet());
      },

      filtered: function () {
        return d.backend.rows && d.backend.rows.length > 0;
      },
      reloadDataFromSchema:function(dataset,cb){
          d.datasetInfo=dataset;
          // TODO: not enough ! missing config ? try init ?
          initData();
          // updateSchema(schema);
          cb();
      },
      brush: changeBrushed,
      refreshSchema: function() {
        // used to ensure that all contolelrs ahve the current schema

          $rootScope.$broadcast('DataSet::schemaLoaded', d.backend.schema);

      },
      initData: initData,
    };

  });
