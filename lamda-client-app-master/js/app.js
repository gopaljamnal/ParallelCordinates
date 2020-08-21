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

// Create empty modules, which will be populated once the deps are loaded.
angular.module('LAMDAClientApp.services', []);
angular.module('LAMDAClientApp.controllers', ['ui.bootstrap']);
angular.module('LAMDAClientApp.directives', []);
angular.module('LAMDAClientApp.filters', []);

// Create a module for the application with the dependencies specified.
angular.module('LAMDAClientApp', ['ngRoute',
    'LAMDAClientApp.services' ,
    'LAMDAClientApp.controllers',
    'LAMDAClientApp.directives',
    'LAMDAClientApp.filters',
    'smart-table',
])
  .config(['$routeProvider', function ($routeProvider) {
   $routeProvider.when('/Data', {
          templateUrl: 'html/partials/data.html'
      });
   $routeProvider.when('/Overview', {
    templateUrl: 'html/partials/overview.html'
   });
    $routeProvider.when('/Summary', {
      templateUrl: 'html/partials/summary.html'
    });
    $routeProvider.when('/Detail', {
      templateUrl: 'html/partials/detail.html'
    });


  $routeProvider.otherwise({
      templateUrl: 'html/partials/overview.html'
  });
 }]);
