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
 * NavBarCtrl
 * Functionality: provides links to other views ( partials) in the app
 *
 * Created By : Fintan McGee (LIST)
 * Date: 14/06/2019
 * ***************/

angular.module('LAMDAClientApp.controllers')
  .controller('NavBarCtrl', ['$scope','$rootScope', '$location','$http', 'AppStatus', function($scope, $rootScope, $location,$http,AppStatus) {

    console.log("NavBarCtrl installed");


    $scope.model = {
        datasetInfo:undefined,
    };
    $scope.showAuthenticationLogOutButton = false;

    // $scope.model.leftItemName = 'view_expandable';


    $scope.model.pageList = [
        {name: "Data",fullName: "Data", enabled: true, index:0},
        {name: "Overview",fullName: "Overview", enabled: true, index:1},
        // {name: "Summary", fullName:"Summary",enabled: true, index:2},
        // {name: "Detail",fullName: "Detail",enabled: true, index:3}
        ];
    $scope.model.pageByName={};
    $scope.model.pageList.forEach((p)=>{
        $scope.model.pageByName[p.name]=p;
    });
    $scope.isActive = function(viewLocation){
      return viewLocation === $location.path();
    };
    $rootScope.$on('DataCtrl::DataSetChanged', function (e, dataSetInfo) {
        $scope.model.datasetInfo=dataSetInfo;
    });
    $rootScope.$on('AppStatus::DataImporting', function (e, dataImporting) {
        // avoid rerender if importing dataset
        if(dataImporting||AppStatus.getParcoordRendering("parcoord")) {
            $scope.model.pageByName["Overview"].enabled = false;
            // $scope.model.pageByName["Summary"].enabled = false;
            // $scope.model.pageByName["Detail"].enabled = false;
        }else{
            $scope.model.pageByName["Overview"].enabled = true;
            // $scope.model.pageByName["Summary"].enabled = true;
            // $scope.model.pageByName["Detail"].enabled = true;
        }
    });
      $rootScope.$on('AppStatus::ParcoordRendering', function (e,parcoordRenderingObj){
          // avoid rerender if already rendering...
          $scope.model.pageByName["Overview"].enabled=!parcoordRenderingObj.rendering;
      });
      $rootScope.$on('AppStatus::DataLoading', function (e,dataLoading){
          // avoid rerender if loading dataset
          if(dataLoading||AppStatus.getParcoordRendering("parcoord")) {
              $scope.model.pageByName["Overview"].enabled = false;
              // $scope.model.pageByName["Summary"].enabled = false;
              // $scope.model.pageByName["Detail"].enabled = false;
          }else{
              $scope.model.pageByName["Overview"].enabled = true;
              // $scope.model.pageByName["Summary"].enabled = true;
              // $scope.model.pageByName["Detail"].enabled = true;
          }
      });

    $rootScope.$on('App::configurationLoaded', function (e, cfg) {
      $scope.showAuthenticationLogOutButton = cfg.authenticationEnabled;
      $scope.model.datasetInfo=cfg.data.info;
    });

  }]);