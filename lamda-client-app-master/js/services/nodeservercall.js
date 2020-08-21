/*jslint white: false, indent: 2, nomen: true */
/*global angular, ocpu, _ */

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
  .service('NodeServerCall', function ($http) {

    'use strict';




    return {
      call: function (fn, args, cb) {
        ocpu.call(fn, args, cb);
      },

      json: function (fn, args, cb) {
        ocpu.call(fn, args, cb);
      }
    };
  });
