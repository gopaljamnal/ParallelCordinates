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
 * data.js
 * Functionality: handle datasets and their schema
 *
 * Created By : Nicolas Medoc (LIST)
 * Date: 14/02/2020
 ********************************/

angular.module('LAMDAClientApp.controllers')
  .controller('DataCtrl', ['$scope','$rootScope', 'DataSet', 'AppStatus',
    function ($scope, $rootScope,DataSet,AppStatus) {
      $scope.model = {currentDataset:undefined,
        schema:undefined// [{name:String, type:String(integer,numeric,character), group:String(Id unique or free name for others), group_type:String(Characteristics,Id), displayOnLoad:String(true,True,false,False) }]
      }; // keep oing model lcoal to this controller

      function initDataSetList(dataSetNameToSelect,cb){
        $scope.model.status = "Refreshing dataset list ...";
        AppStatus.setStatus($scope.model.status);
        DataSet.getDatasetList(function(datasetList){
          $scope.model.datasetList=datasetList;
          if($scope.model.datasetList.length>0){
            const callback_f=function(currentDataset){
              $scope.model.status = "Dataset '"+currentDataset.name+"' selected for loading...";
              AppStatus.setStatus($scope.model.status);

              $scope.selectDataset(currentDataset,cb);
              // DataSet.getSchemaForDataset({dataSetName:$scope.model.currentDataset.name},function(schema){
              //   $scope.model.schema = schema;
              //   $scope.model.status = "Schema displayed !";
              //   cb();
              // })
            };

            // use dataSetNameToSelect if not null or undefined and search in datasetList
            if(dataSetNameToSelect){
              const currentDataset = $scope.model.datasetList.filter((dataset)=>{
                return dataset.name===dataSetNameToSelect;
              })[0];
              callback_f(currentDataset);
            }else {
              DataSet.getCurrentDatasetInfo(function(dataset){
                // $scope.model.currentDataset = dataset;
                callback_f(dataset);
              });
            }

          }else{
            $scope.model.status = "No Dataset found !";
            AppStatus.setStatus($scope.model.status);
            cb();
          }

        })

      }
      // called in ng-init of the controller
      $scope.init = function() {
        console.log("initializing data ctrl");
        // does not work may be due to parcoordsctrl is no more available in partial/data.html ?
        // $rootScope.$broadcast("Data::InvalidateRendering",{});
        // does not work may be due to call of d3.timer which is no more under control because parcoordsctrl is no more available ?
        // AppStatus.setParcoordRendering("parcoord",false,0,true);
        $scope.model.status = "Data initialization...";
        AppStatus.setStatus($scope.model.status);
        $scope.model.file=undefined;
        $scope.model.currentDataset=undefined; // selected dataset
        $scope.model.dataSetName=undefined; // used for uploading new dataset
        $scope.model.shortDesc=undefined; // used for uploading new dataset
        $scope.model.isLoading=true;
        $scope.model.importingFile=false;
        initDataSetList(undefined,function(){
          $scope.model.isLoading=false;
        });
      };

      // called when the user chose in the combobox a dataset already stored in the database
      // called from initDatasetList() called from init() and sendFile()
      $scope.selectDataset=function(currentDataset,cb){
        AppStatus.setDataLoading(true);
        $scope.model.currentDataset=currentDataset;
        $scope.model.status = "Getting dataset schema...";
        DataSet.getSchemaForDataset({dataSetName:$scope.model.currentDataset.name},function(schema){
          $scope.model.schema=schema;
          $scope.model.status = "Schema displayed !";
          AppStatus.setStatus("Loading dataset '"+$scope.model.currentDataset.name+"'...");
          const dataImporting = AppStatus.getDataImporting();
          if(!dataImporting) {
            DataSet.reloadDataFromSchema($scope.model.currentDataset,function(){
              $rootScope.$broadcast("DataCtrl::DataSetChanged",$scope.model.currentDataset);
              $scope.model.status = "Dataset updated for loading !";
              AppStatus.setStatus("Dataset '" + $scope.model.currentDataset.name + "' ready for display!");
              AppStatus.setDataLoading(false);
              if(cb)cb();
            });
          }else{
            AppStatus.setStatus("Dataset '" + $scope.model.currentDataset.name + "' selected. Waiting end of processing!");
            if(cb)cb();
          }
        })

      };
      const _wrongDatasetName=/[^\w]|-/g;
      $scope.isWrongDatasetName=false;
      function changeDatasetName(dataSetName){
        let result=dataSetName;
        const lastDotIndex=result.lastIndexOf(".");
        if(lastDotIndex!==-1) {
          result = result.substring(0, lastDotIndex);
        }
        result=result.replace(new RegExp(_wrongDatasetName),"_");
        return result;
      }

      $scope.fileNameChanged=function(element){
        console.log(element.files[0].name);
        $scope.model.file = element.files[0];
        $scope.model.dataSetName=changeDatasetName($scope.model.file.name);
        // const lastDotIndex=$scope.model.dataSetName.lastIndexOf(".");
        // if(lastDotIndex!==-1) {
        //   $scope.model.dataSetName = $scope.model.dataSetName.substring(0, lastDotIndex);
        // }
        // $scope.model.dataSetName=$scope.model.dataSetName.replace(_wrongDatasetName,"_");
        $scope.updateWrongDatasetName();
        $scope.$apply();
      };

      $scope.updateWrongDatasetName=function(){
        $scope.isWrongDatasetName=(new RegExp(_wrongDatasetName)).test($scope.model.dataSetName)
      };

      // called in import button
      $scope.sendFile=function(){
        $scope.updateWrongDatasetName();
        if($scope.isWrongDatasetName) {
          $scope.model.dataSetName = changeDatasetName($scope.model.dataSetName);
        }
        $scope.model.importingFile=true;
        AppStatus.setDataImporting(true);
        $scope.model.status = "Uploading data...";
        AppStatus.setStatus($scope.model.status);

        // const data={file:$scope.model.file,name:$scope.model.dataSetName,shortDesc:$scope.model.shortDesc};
        var fd=new FormData();
        // fd.append('file',sendFileModel);
        fd.append('file',$scope.model.file);
        fd.append('metadata',angular.toJson({name:$scope.model.dataSetName,shortDesc:$scope.model.shortDesc}));
        // fd.append('name',$scope.model.name);
        // fd.append('shortDesc',$scope.model.shortDesc);
        DataSet.sendDatasetFile(fd,function(response){
          // response is schema data:
          $scope.model.status = "Data set uploaded! The list is refreshing...";
          AppStatus.setStatus($scope.model.status);
          $scope.model.importingFile=false;
          AppStatus.setDataImporting(false);

          initDataSetList($scope.model.dataSetName,function(){});
          // $scope.init();
        })
        // $rootScope.$broadcast("DataCtrl::sendFile", data);
      };// end sendFile()

      // never used!
      // $scope.loadData=function(){
      //   // updateSchema
      //   DataSet.reloadDataFromSchema($scope.model.currentDataset,function(){
      //     $scope.model.status = "Dataset updated for loading !";
      //   });
      // };
      // $rootScope.$on("OpenCPU.fileSent",function(ev, data){
      //   $scope.model.importingFile=false;
      // })
      // $scope.loadFile=function(event){
      //
      //     $scope.model.selectedFileObject=event.target.files[0];
      //     sendDataToServer($scope.model.selectedFileObject);
      //
      // };
    }]
  );