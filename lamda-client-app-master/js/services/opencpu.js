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
  .service('OpenCPU', function ($http) {

    'use strict';

    // For testing without having to re-install the R-plugin over and over again
    // enable the following line, adjust the path, and run:
    // rparcoords/inst/www $ python -m SimpleHTTPServer
    //
    // NOTE: Make sure that this line is disabled when you run gulp to generate
    //       the minimized version!
    //ocpu.seturl("//localhost/ocpu/user/bertjan/library/ICoVeR/R", false);

    function asJson(callback) {
      return function (session) {
        //$http({method: 'GET', url: session.loc + "R/.val/json?auto_unbox=true"})
        var urlPrefix = session.loc || "";
        $http({method: 'GET', url: urlPrefix + "R/.val/json?auto_unbox=true"})
          .success(_.partial(callback, session));
      };
    }

    return {
      call: function (fn, args, cb) {
        ocpu.call(fn, args, cb);
      },

      json: function (fn, args, cb) {
        ocpu.call(fn, args, asJson(cb));
      },
      nodeJson: function (fn, args, cb) {
        //ocpu.call(fn, args, cb);
        var session = {loc:"", key:""};
        $http({method: 'POST', url: "/data/" + fn,data:args})
          .success(_.partial(cb, session));
      },
      nodeUploadFile:function(fn,args,cb){
        var session = {loc:"", key:""};
        $http.post("/data/" + fn,args,{
          headers: {'Content-Type': undefined},
          transformRequest: angular.identity
        }).success(_.partial(cb, session));

      },
      nodeOpenCPUJson: function (fn, args, cb) {
        //ocpu.call(fn, args, cb);
        var session = {loc:"", key:""};

        $http({method: 'POST', url: "/ocpu/json/",data: {functionName:fn,args:args}})
          .success(_.partial(cb, session));
      },
      d3Json: function (fn, args, cb) {
        //ocpu.call(fn, args, cb);
        var session = {loc:"", key:""};

        if(fn==="app.init") {
          d3.json("app_init_response.json", function (callData) {
            console.log("Handling D3 json call")
            console.log("data: " + JSON.stringify(callData))
            cb(session, callData)
          });
          // $http({method: 'POST', url: "/R/" + fn,data:args})
        } else if(fn==="data.get") {
          d3.json("initialDataSet.json", function (callData) {
            console.log("Handling D3 json call")
            console.log("data: " + JSON.stringify(callData))
            cb(session, callData)
          });

        }
        //   .success(_.partial(cb, session));
      }


    };
  });
