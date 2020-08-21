/*jslint browser: true, todo:true, nomen: true, indent: 2 */
/*global angular, crpgl, list, d3, ocpu, _, $*/

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
 * datatablectrl.js
 * Functionality: display dataset in table format
 *
 * Created By : Nicolas Medoc (LIST)
 * Date: 18/05/2020
 ********************************/
angular.module('LAMDAClientApp.controllers')
    .controller('DataTableCtrl', function ($scope, $rootScope, $element, $window, $modal, DataSet, Color) {
        'use strict';
        $scope.model={
            fullDatasetMode:"fullDataset",
            selectionOnlyMode:"selectionOnly",
            selectionFirstMode:"selectionFirst",
        };

        $scope.state={
            displayMode:$scope.model.selectionOnlyMode,
            nbItemsByPage:10,
            syncWithHighlight:true,
            syncWithFilter:true,
            fullDataList:[],
            selectionDataList:[],
            schema:[],
            fullSchema:[],
            selectedPredicate:undefined,
            predicates:[],
            selectedRow:undefined,
            colorFn:undefined,
        };

        function setColor(){

        }
        function changeSelection(){

        }
        function removeColumnByName(columnName, schema){
            let indexOfColumnName=-1;
            schema.forEach((column,i)=>{
                if(column.name===columnName) {
                    indexOfColumnName = i;
                    return
                }
            });
            if(indexOfColumnName!==-1){
                schema.splice(indexOfColumnName,1) // remove item at pos columnName.
            }

        }
        function retrieveSchema(){
            let firstRetrieving=false;
            if($scope.state.schema.length===0){
                firstRetrieving=true;
            }
            let schema=DataSet.schema();
            if(schema){
                $scope.state.schema=schema.slice(1);
            }
            removeColumnByName('Manual selection',$scope.state.schema);
            removeColumnByName('P x+y contribution',$scope.state.schema);

            $scope.state.schema=[{name:"row"}].concat($scope.state.schema);
            if(!$scope.options.variables||$scope.options.variables.length===0) {
                $scope.options.variables=$scope.state.schema;
            }
            if(firstRetrieving){
                $scope.state.fullSchema=$scope.state.schema.slice(0);
            }
            schemaChanged();
        }
        function schemaChanged(){
            $scope.state.selectedPredicate={name:"All"};
            $scope.state.predicates=[$scope.state.selectedPredicate].concat($scope.state.schema);
        }
        function getDataFromServer(){
            const variables=$scope.state.schema.map((variable)=>{
                return variable.name;
            });
            DataSet.get(variables,retrieveData);
        }
        function retrieveData(){
            $scope.state.fullDataList = DataSet.data(!$scope.state.syncWithFilter);//.slice(0,100);
            // $scope.state.fullDataList=DataSet.brushed();//.slice(0,100);
        }
        function retrieveBrushedData(){
            const rows=DataSet.brushed();
            if ($scope.state.syncWithHighlight && rows !== undefined && rows.length > 0){
                $scope.state.fullDataList = rows;
            }else{
                retrieveData();
            }

        }
        $scope.init=function(){
            retrieveSchema();
            retrieveData();
            // var variableValues = {};
            //
            // _.each(rows, function (row) {
            //     variableValues[row.row] = row[variable];
            // });

            $scope.colorFn=Color.colorFn();

            setColor();
            changeSelection();
        };

        $scope.rowSelection=function(row){
            if($scope.state.selectedRow) {
                $scope.state.selectedRow.isSelected = !$scope.state.selectedRow.isSelected;
            }
            row.isSelected=!row.isSelected;
            // if(row.isSelected)
            //     row.isSelected=false;
            // else
            //     row.isSelected=true;
            $scope.state.selectedRow=row;
            $rootScope.$broadcast("DataTable::rowSelection",row.row)
        };
        $scope.getSelectedClass=function(row){
            if(row.isSelected)
                return "info";
                // return "row-selected";
            else
                return "row-unselected";
        };
        $scope.nbColumnsRatio=function(ratio){
            return Math.floor($scope.state.schema.length*ratio);
        };
        // $scope.getNbPages=function(){
        //     const oneMoreForRest=$scope.state.fullDataList.length%$scope.state.nbItemsByPage===0?0:1;
        //     return Math.floor($scope.state.fullDataList.length/$scope.state.nbItemsByPage)+oneMoreForRest;
        // };
        // $scope.$on("DataSet::brushed", function (ev, brushed, method) {
        //
        // });
        $scope.syncWithFilterChanged=function(){
            retrieveBrushedData();
        };
        $scope.syncWithHighlightChanged=function(){
            retrieveBrushedData();
        };
        $scope.options = {
            variables: [],
            valid: function () {
                return $scope.options.variables.length > 2;
            }
        };
        function setNewSchemaVariables(config){
            $scope.state.schema=config.variables.slice(0);
            schemaChanged();
        }
        $scope.openSelectionDialog = function () {
            // TODO: create and use js/templates/similarityconfig.html and SimilarityConfigCtrl instead of using ClusterConfig
            var dialog = $modal.open({
                templateUrl: 'js/templates/datatableconfig.html',
                size: 'md',
                controller: 'DataTableConfigCtrl',
                resolve: {
                    options: function () {
                        return $scope.options;
                    }
                }
            });

            // if( DataSet.schema()){
            //     d.schema = DataSet.schema();
            //     setVariables();
            //
            //     if( $scope.options.methods.length < 1) {
            //         // in case where similarity methods have already been retrieved by the time this contoller is being instantiated
            //         $scope.options.methods = Analytics.similarityMethods();
            //         $scope.canApply = $scope.options.valid();
            //     }
            // }


            dialog.result.then(setNewSchemaVariables);
        }; // end openSelectionDialog()


        $scope.$on("DataSet::dataLoaded", function (ev, data) {
            retrieveData();
            retrieveSchema();
            // if existing items were highlighted before  highlight it if they exists.
            // Is it appropriate to remove them if they don't exist anymore?
            if ($scope.selectionDataList.length) {
            }
        });
        // $scope.$on("DataSet::filtered", function (ev, filteredData) {
        //     retrieveData();
        //     retrieveSchema();
        // });
        $scope.$on('DataSet::schemaLoaded', function (e, schema) {
            retrieveSchema();
        });

        $scope.$on('DataSet::initialDataLoaded', function(){
            getDataFromServer();
            // retrieveData();
        });
        $rootScope.$on("DataSet::brushed", function (ev, rows, method) {
            if ($scope.state.syncWithHighlight && rows !== undefined && rows.length > 0){
                $scope.state.fullDataList = rows.slice();
            }else{
                retrieveData();
            }
        });
        $scope.$on("Colors::changed", function () {
            setColor();
            changeSelection();
        });
        console.log("datatablectrl.js initialized");
  });