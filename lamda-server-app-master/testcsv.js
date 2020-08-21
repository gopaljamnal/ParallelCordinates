var   fs = require('fs'), // for file system interaction
    csv =require('csvtojson');

const datasetName = "data/test.csv"
const csvConfig={delimiter:[";",",","|"],flatKeys:true,output:"json",noheader:false};
csv(Object.assign(csvConfig,{checkType:true}))
    .fromFile(datasetName)
    .then(function(row) {
        const header=row[0];
        console.log(row)
    })
;
