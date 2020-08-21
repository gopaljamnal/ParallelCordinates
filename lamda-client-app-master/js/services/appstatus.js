/*jslint todo:true, unparam: true, nomen: true, indent: 2 */
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
 * appstatus.js
 * Functionality: handle application status to actions enabling and inform the current status of procesing
 *
 * Created By : Nicolas Medoc (LIST)
 * Date: 22/06/2020
 ********************************/
angular.module('LAMDAClientApp.services')
  .service('AppStatus', function ($rootScope) {

    'use strict';
    const model={
        status:"Service appstatus initialized",
        dataImporting: false,
        dataLoading:false,
        dataProcessing:false,
        rendering:{parcoord:{
                rendering: false,
                rowsCount:0,
                remainingRenderingNb:0,
                refreshSize:1000,
            },brush:{
                rendering: false,
                rowsCount:0,
                remainingRenderingNb:0,
                refreshSize:250,
            }
        }
    };
    return {
      getStatus: function () {
          return model.status;
      },

      setStatus: function (message) {
          model.status=message;
          $rootScope.$broadcast("AppStatus::Message",message)
      },
      getDataImporting: function (){
          return model.dataImporting;
      },
      setDataImporting: function (dataImporting){
          model.dataImporting=dataImporting;
          $rootScope.$broadcast("AppStatus::DataImporting",dataImporting)
      },
      getDataLoading: function (){
          return model.dataLoading;
      },
      setDataLoading: function (dataLoading){
          model.dataLoading=dataLoading;
          $rootScope.$broadcast("AppStatus::DataLoading",dataLoading)
      },
      getDataProcessing: function (){
          return model.dataProcessing;
      },
      setDataProcessing: function (dataProcessing){
          model.dataProcessing=dataProcessing;
          $rootScope.$broadcast("AppStatus::DataProcessing",dataProcessing)
      },
      getParcoordRendering: function (action){
          return model.rendering[action].rendering;
      },
      getParcoordRowsCount: function (action){
            return model.rendering[action].rowsCount;
      },
      setParcoordRendering: function (action,parcoordRendering, rowsCount,withApply){
          const func=function() {
              model.rendering[action].rendering = parcoordRendering;
              if (parcoordRendering) {
                  model.rendering[action].rowsCount = rowsCount;
                  model.rendering[action].remainingRenderingNb = rowsCount;
              }
              $rootScope.$broadcast("AppStatus::ParcoordRendering", {
                  action: action,
                  rendering: parcoordRendering,
                  rowsCount: rowsCount,
                  withApply: withApply
              });
          };
          if (withApply){
              $rootScope.$apply(func);
          }else{
              func();
          }
      },
      getParcoordRemainingRenderingNb: function (action){
          return model.rendering[action].rendering;
      },
      setParcoordRemainingRenderingNb: function (action,parcoordRemainingRenderingNb,withApply){
          const func=function() {
              const renderedNb = model.rendering[action].rowsCount - parcoordRemainingRenderingNb;
              const newTrunkPos = renderedNb % model.rendering[action].refreshSize;
              if (newTrunkPos === 0 || parcoordRemainingRenderingNb === 0) { // check if in new trunk size is reached
                  model.rendering[action].remainingRenderingNb = parcoordRemainingRenderingNb;
                  $rootScope.$broadcast("AppStatus::ParcoordRemainingRenderingNb", {
                      action: action,
                      remainingRenderingNb: parcoordRemainingRenderingNb,
                      withApply: withApply
                  })
              }
          };
          if (withApply){
              $rootScope.$apply(func);
          }else{
              func();
          }

      }
    };
  });
