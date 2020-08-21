/*jslint indent: 2, nomen: true */
/*global angular, _*/

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

angular.module('LAMDAClientApp.controllers')
  .controller('ESCGCtrl', function ($rootScope, $scope, DataSet) {

    'use strict';

    var d = {},
    initialMultiCopyGenes = -1; // used to store the initial total count of multicopy genes ( and hence determine howmany are missing) fintan.mcgee@list.lu
    $scope.uniqueGenes = 0;
    $scope.multiCopyGenes = '0 / 0';
    $scope.missingGenes = 0;
    $scope.totalGenes = 0;

    function updateGeneCounts(data) {
      var contigs = d.contigs,
        escg = {},
        multiCopyGenes = 0,
        additionalCopies = 0;

      _.forEach(data, function (datum) {
        var contig = datum.CONTIG,
          asseccesions;

        if (contigs.hasOwnProperty(contig)) {
          asseccesions = _.isArray(contigs[contig]) ? contigs[contig] : [contigs[contig]];
          _.forEach(asseccesions, function (a) {
            escg[a] = escg[a] === undefined ? 1 : escg[a] + 1;
          });
        }
      });


      _.forEach(Object.getOwnPropertyNames(escg), function (asseccion) {
        if (escg[asseccion] > 1) {
          multiCopyGenes = multiCopyGenes + 1;
          additionalCopies = additionalCopies + escg[asseccion] - 1;
        }
      });
      if(initialMultiCopyGenes < 0) {
        initialMultiCopyGenes = multiCopyGenes;
      }
      $scope.uniqueGenes = Object.getOwnPropertyNames(escg).length;
      $scope.multiCopyGenes = multiCopyGenes + ' / ' + additionalCopies;
      //$scope.missingGenes = d.asseccesions.length - $scope.uniqueGenes;// fintan.mcgee@list.lu
      $scope.missingGenes = initialMultiCopyGenes - $scope.uniqueGenes;
      $scope.totalGenes = $scope.uniqueGenes + additionalCopies;
    }

    /*jslint unparam: true */
    $rootScope.$on('App::configurationLoaded', function (e, cfg) {
      d.asseccesions = cfg.escg.asseccion;
      d.contigs = cfg.escg.contigs;
      DataSet.get('CONTIG', updateGeneCounts);
    });

    $rootScope.$on('DataSet::brushed', function (e, data) {
      if (data.length > 0) {
        updateGeneCounts(data);
      } else {
        // there is a chance that this function will be called before data arrives
        // so we need to check if there actually is data
        if (DataSet.data().length) {
          updateGeneCounts(DataSet.data());
        }
      }
    });

    $rootScope.$on('DataSet::filtered', function (e, data) {
      updateGeneCounts(data);
    });
    /*jslint unparam: false */

  });
