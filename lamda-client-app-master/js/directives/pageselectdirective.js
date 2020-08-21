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
 * pageselectdirective.js
 * Functionality: allows to input the page number manully in datatable (called )
 *
 * Created By : Nicolas Médoc (LIST) from example in http://lorenzofox3.github.io/smart-table-website/
 * Date: 25/05/2020
 ********************************/
angular.module('LAMDAClientApp.directives')
    .directive('pageSelect', function() {
        return {
            restrict: 'E',
            template: '<input type="text" class="select-page" ng-model="inputPage" ng-change="selectPage(inputPage)">',
            link: function(scope, element, attrs) {
                scope.$watch('currentPage', function(c) {
                    scope.inputPage = c;
                });
            }
        }
    });