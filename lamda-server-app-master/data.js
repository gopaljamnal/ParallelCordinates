/*
    LAMDA - Server
    
    Copyright 2019 Luxembourg Institute of Science and technology <tto@list.lu>.
                   All rights reserved.
*/


/**
 * Simple module to load and stroe data set in memorey
 * Loads data from the file specired , unless data already iexsits in the data base
 * Provides access functions for other modules to receive subset s of the data
 *
 * @module data
 * @requires fs
 * @requires csvtojson
 * @requires app-config
 * @requires ./serverLogging.js
 * @author Fintan McGee (LIST) fintan.mcgee@list.lu
 */



var   fs = require('fs'), // for file system interaction
 csv =require('csvtojson'),
 db = require('./persistentData.js'),
 cfg = require('app-config'),
 logger = require('./serverLogging.js'),
  runtimeConfig = require('./runtimeConfiguration');

// data is sotred as an array of objects
// each index in the arax is a row.
// ieach property in an obejct is a cell in that row
var dataStore = null, schema =null, schemaMap = {}, dMap = {}, idFieldName,
  dataFilePath = __dirname +  cfg.server.dataFilePath,
  dataSchemaFilePath = __dirname + cfg.server.dataSchemaFilePath,
  rowCount= 0,
  colCount=0,
  datasetName,
  dataIsLoaded = false,
  username = "default";

function loadData() {
  datasetName = dataFilePath.substring(dataFilePath.lastIndexOf("/")+1,dataFilePath.lastIndexOf(".csv"));
  db.tableExists(datasetName, function(err, tableExists) {

     if(!tableExists) {
       logger.log("no table found, loading data from file " + dataFilePath);
       loadDataByAutoExtractMetadata(dataFilePath, "Dataset loaded by default");
       // loadDatafromCSV();
     } else {
       logger.log("Table found in db for database , loading data from DB: " + datasetName);
       loadDatafromDB(datasetName,function(){
         console.log("Data loaded from DB for initialization !")
       });
     }
    });


}

function loadDatafromDB(datasetName_p,cb) {
  db.loadData(datasetName_p,function(dataset, datasetSchema) {
    // TODO: Change data types depending on schema
    datasetName = datasetName_p;
    dataStore = dataset;
    schema = datasetSchema;
    dMap = {};
    schemaMap = {};
    dataStore.forEach(function (dataRow){
      dMap["" +  dataRow["row"] ] = dataRow; // forcing a map
    });
    schema.forEach(function (dataRow) {
      schemaMap[dataRow.name] = schema[schema.length - 1];
      // TODO: handle "id" vs "row" correctly
      if(dataRow.group === "Id") {
        idFieldName = dataRow.name;
      }
    });

    colCount = schema.length;
    rowCount = dataStore.length;
    runtimeConfig.setDataDimensions(rowCount, colCount);
    runtimeConfig.setSchema(schema);
    logger.log("Table \"" + datasetName +"\"" + " loaded from DB" );
    getDataset(function(datasetInfo){
      runtimeConfig.setDataSetInfo(datasetInfo);
      dataIsLoaded = true;
      cb();
    });
  });
}
function isNa(strValue){
  const str=strValue.trim().toLowerCase();
  return str==="na"||str==="n/a"||str==="nan"
}
function replaceNaNByZero(jsonObj,column,type){
  // get column index from header
  const columnIdx=jsonObj[0].indexOf(column);
  if (type!=="character"){
    jsonObj.forEach((item,i)=>{
      const str=item[columnIdx];
      // ignore header to check NaN
      if(i>0 && isNa(str)){
        if(type="numeric") {
          item[columnIdx] = "";
        }else if(type="integer"){
          item[columnIdx] = "";
        }
      }
    })
  }
}
function checkTypes(strValue){
  const result={empty:false,integer:false,numeric:false,character:false}
  const regexpNoNumberCharacter=/[^0-9.e]/g;
  const regexInt = /[+-]?[0-9][0-9]*/g;
  const regexFloat = /[+-]?[0-9]+(\\.[0-9]+)?([Ee][+-]?[0-9]+)?/g;
  if(strValue===undefined||strValue===null||strValue.trim()===""||isNa(strValue)){
    result.empty=true;
  }else if(regexpNoNumberCharacter.test(strValue)){
    result.character=true;
  } else if(strValue.indexOf(".")===-1 && strValue.indexOf("e")===-1) {
      result.integer=regexInt.test(strValue);
      result.character=!result.integer
  }else{
      result.numeric=regexFloat.test(strValue);

      result.character=!result.numeric
  }
  return result;
}
const csvConfig={delimiter:[";",",","|"],flatKeys:true };
function importUploadedDataset(params,cb){
  // params.shortDesc
  // params.name
  datasetName =params.name;

  extractMetadataFromCSV(params.filePath,params.name,params.shortDesc,function(metadataExtracted){
      schema=metadataExtracted.columnOrder.map(column=>{
        schemaMap[column]=metadataExtracted.metadataByColumn[column];
        return metadataExtracted.metadataByColumn[column];
      });

      colCount=metadataExtracted.columnOrder.length;
      loadDatasetFile(params.filePath, params.shortDesc,function(){
        logger.log("Dataset '"+datasetName+"' imported after uploading with shorDesc='"+params.shortDesc+"' !");
        cb();
      });
  });
}
function extractMetadataFromObject(jsonObj,datasetName,shortDescription,cb){
  //Count each possible types of columns for several rows
  const nbValuesMaxToTest=jsonObj.length;
  const nbRows=jsonObj.length-1;
  const statByColumn = {};
  const header=jsonObj[0];
  header.forEach((column,colPos)=>{
    // FIXME: check if column name == "row" and throw exception if any
    const stat={nonEmptyRows:0,empty:0,character:0,integer:0,numeric:0,distinct:0};
    if(statByColumn[column]===undefined){
      statByColumn[column]=stat;
    }
    const colData=jsonObj.map(row=>{
      return row[colPos];
    }).slice(1,jsonObj.length); // remove header
    const colDataSet=new Set(colData);
    stat.distinct=colDataSet.size;
    for(let i=1;i<jsonObj.length&&stat.nonEmptyRows<nbValuesMaxToTest;i++){
    // for(let i=0;i<colData&&stat.nonEmptyRows<nbValuesMaxToTest;i++){
      const dataRow=jsonObj[i];
      const types = checkTypes(dataRow[colPos]);
      if(!types.empty){
        stat.nonEmptyRows++;
      }
      Object.keys(types).forEach(type=>{
        if(types[type])
          stat[type]=stat[type]+1;
      })
    }

  }); // en for each header
  // chose a default type depending on the frequency in the column
  const metadataByColumn={};
  let idFound=false;
  Object.keys(statByColumn).forEach(column=>{
    const metadata={name:column,group:"Feature",group_type:"Characteristics",displayOnLoad:true};

    // if(statByColumn[column].character>100){ // TODO short fix for character type: strong assomption about number of character values
    if(statByColumn[column].character>0){
      metadata.type="character"
    }else if(statByColumn[column].numeric>0){ // TODO numeric and integer type even if exists character values (Work without error in sqlite)
      metadata.type="numeric"
    }else if(statByColumn[column].integer>0){ // TODO numeric and integer type even if exists character values (Work without error in sqlite)
      // metadata.type="numeric"
      metadata.type="integer"
    }else{
      metadata.type="empty";
      metadata.displayOnLoad=false;
    }
    // TODO: handle "id" vs "row" correctly
    // search the possible id columns and propose one to the user
    // if(column==="id"){
    if((metadata.type==="character"||metadata.type==="integer")&&statByColumn[column].distinct===nbRows){
      // if first unique column found
      metadata.displayOnLoad=false;
      // TODO: handle "id" vs "row" correctly
      if (!idFound){
        idFound=true;
        idFieldName=column;
        metadata.group="Id";
        metadata.group_type="Id";
      }else{
        metadata.group="IsUnique";
      }
      // }else if(column === "CORRECTING_TEMPERATURE_0C"||column === "TIRE_SEQUENCE"|| column === "CONSTRUCTION_NUMBER" ||column === "CAMBER_ANGLE_DEG" || column === "ROLL_RES_GRADE"){
      //   metadata.displayOnLoad = false
    }
    metadataByColumn[column]=metadata;

    replaceNaNByZero(jsonObj,column,metadata.type)
  });
  if(!idFound){
    // TODO: check effect of adding row in metadataByColumn and header
    const metadata={name:"row",type:"integer",group:"Id",group_type:"Id",displayOnLoad:false};
    metadataByColumn["row"]=metadata;
    header.splice(0, 0, "row");
  }
  cb({metadataByColumn:metadataByColumn,columnOrder:header})
}
function extractMetadataFromCSV(dataFilePath,datasetName,shortDesc,cb){
  var workingFileExsits =  false;
  logger.log("loading data from: " + dataFilePath);
      // datasetName = dataFilePath.substring(dataFilePath.lastIndexOf("/")+1,dataFilePath.lastIndexOf(".csv"));
  csv(Object.assign({checkType:true,output:"csv",noheader:true},csvConfig))// !!! noheader is inverted for "csv" case ???!!!
      .fromFile(dataFilePath)
      .then(function(jsonObj) {
        extractMetadataFromObject(jsonObj,datasetName,shortDesc,cb)
      })
  ;
}
function loadDatasetFromObject(jsonObj,shortDescription,cb){
  // for(var i =0;  i <jsonObj.length; i++ ){
  //   console.log(JSON.stringify(jsonObj[i]));
  // }

  dMap = {};
  // add row column if not exists to use as column index ?
  jsonObj.forEach(function (dataRow, index) {
    // TODO: Change data types depending on schema

    if (!dataRow.hasOwnProperty("row")) {
      dataRow["row"] = index + 1; // starting at 1 as we are mimicing an R call and R begins indexing at 1
    }
    dMap["" +  dataRow["row"] ] = dataRow; // forcing a map
  });
  rowCount = jsonObj.length;
  // for(var i =0;  i < 10; i++ ){
  //   console.log(JSON.stringify(jsonObj[i]));
  // }

  dataStore = jsonObj;
  runtimeConfig.setDataDimensions(rowCount, colCount);
  runtimeConfig.setSchema(schema);
  logger.log("Table \"" + datasetName +"\"" + " loaded from file" );
  db.initialiseDatasetTable(datasetName,shortDescription,schema,dataStore,function(err,response){
    if(err){
      logger.log("unable to initialize dataset !");
    }else{
      if(response.tableExists){
        logger.log("Table '"+datasetName+"' already exists");
      }else{
        logger.log("Table '"+datasetName+"' created in the database!");
      }
      getDataset(function(datasetInfo){
        runtimeConfig.setDataSetInfo(datasetInfo);
        dataIsLoaded = true;
        cb();
      });

    }
  });
}
function loadDatasetFile(dataFilePath,shortDescription,cb){
  csv(Object.assign({checkType:true},csvConfig))
      .fromFile(dataFilePath)
      .then(function(jsonObj){
        loadDatasetFromObject(jsonObj, shortDescription, function(){
          logger.log("loadDatasetFileDone !");
          cb();
        })
      }) // end csv.then()
  ;
}
function loadDataByAutoExtractMetadata(dataFilePath,shortDescription){

  datasetName = dataFilePath.substring(dataFilePath.lastIndexOf("/")+1,dataFilePath.lastIndexOf(".csv"));
  extractMetadataFromCSV(dataFilePath,datasetName,shortDescription,function(metadataExtracted){
    schema=metadataExtracted.columnOrder.map(column=>{
      schemaMap[column]=metadataExtracted.metadataByColumn[column];
      return metadataExtracted.metadataByColumn[column];
    });

    colCount=metadataExtracted.columnOrder.length;
    console.log("Metadata extracted!");
    console.log("Loading dataset File ...");
    loadDatasetFile(dataFilePath, shortDescription,function(){
      console.log("Data loading with metadata extraction from '"+dataFilePath+"' Done !");
    });

  });
}
// function loadDatafromCSV(){
//
//   var workingFileExsits =  false;
//
//   logger.log("loading data from: " + dataFilePath);
//   // init metadata
//   datasetName = dataFilePath.substring(dataFilePath.lastIndexOf("/")+1,dataFilePath.lastIndexOf(".csv"));
//    //DEBUG test line
//
//   csv(csvConfig).fromFile(dataSchemaFilePath).then(function(schemaJsonObj) {
//     schema = [];// [{name:String, type:String(integer,numeric,character), group:String(Id unique or free name for others), group_type:String(Characteristics,Id), displayOnLoad:String(true,True,false,False) }]
//     schemaMap = {}; // key:name  value:schemaObj
//     schemaJsonObj.forEach(function(dataRow, index) {
//       const schemaRow={name:dataRow.name,
//         type:dataRow.type,
//         group:dataRow.group,
//         group_type:dataRow.group_type,
//         displayOnLoad: dataRow.displayOnLoad === "true" || dataRow.displayOnLoad === "TRUE"
//       };
//       schema.push(schemaRow);
//       schemaMap[dataRow.name] = schemaRow;
//       // schemaMap[dataRow.name] = schema[schema.length-1];
//       if(dataRow.group === "Id") {
//         idFieldName = dataRow.name;
//       }
//     });
//     colCount = schemaJsonObj.length;
//     console.log("Schema loaded");
//     loadDatasetFile(function(){
//       console.log("Data Loaded from csv '"+dataFilePath+"' !");
//     });
//   }); // end csv.then()
// }

function getSchemaVariableNames( ) {
  var schemaQueryVariables = [];
  if (schema.length) {
    for (var schemaLabel in schema[0]) {
      schemaQueryVariables.push("\"" + schemaLabel + "\"");
    }
  }

  return schemaQueryVariables;
}

/**
 *
 * @param variables
 * @returns {[Object]} list of data rows
 */
module.exports.get = function(variables)  {
  var returnData = [];
  dataStore.forEach(function(dataItem) {
    returnData.push({row:dataItem.row});
    var lastItem = returnData[returnData.length -1];

    variables.forEach(function(varName) {
      lastItem[varName] = dataItem[varName];
    });

  });

  return returnData;

};

function filterCols(colNames) {
  // returns a filtered version of the data set by col name

  var filteredData = [];
  dataStore.forEach(function(dataItem) {
    filteredData.push({});
    var lastItem = filteredData[filteredData.length -1];

    colNames.forEach(function(varName) {
      if(dataItem.hasOwnProperty(varName)) {
        lastItem[varName] = dataItem[varName];
      }
    });

  });

  return filteredData;
}

function filterRows(rows) {
  // returns a filttered version of the data set by col name

  var filteredData = [];

  rows.forEach(function (rowId) {

    if (dMap.hasOwnProperty("" + rowId)) {
      var dataItem = dMap["" + rowId]
      filteredData.push(dataItem);
    }
  });

  return filteredData;
}

/*
 * Get the dataset in a array of objects filtered with the rows and colNames given in parameters
 * return: [{colName:value}]
 *    The filtered dataset
 */
module.exports.filter  = function (rows, colNames) {
  // returns a filttered version of the data set by col name
 var filteredData  = [];
  if(rows && colNames) {
    rows.forEach(function (rowId) {

      if (dMap.hasOwnProperty("" + rowId)) {
        var dataItem = dMap["" + rowId]
        filteredData.push({});
        var lastItem = filteredData[filteredData.length - 1];
        colNames.forEach(function (varName) {
          if (dataItem.hasOwnProperty(varName)) {
            lastItem[varName] = dataItem[varName];
          }
        });
      }
    })
  } else if (colNames) {
    filteredData = filterCols(colNames);
  } else {

  }
  return filteredData;

};

// Add a new column to the main data structrrue
/**
 *
 * @param colIdentifier {String}the name f the column to be added
 * @param colDataArray  {Array}a data array ( the length  of the data set ) containing the column values
 *                      and thier assopciated row ( for every rtow)
 */
function addCol( colIdentifier, colDataArray) {

  var clusteringLabelExists = false;
  dataStore.forEach(function(dataItem) {

    dataItem[colIdentifier] = -1;
  });
  colDataArray.forEach(function(dataItem) {
    if (dMap.hasOwnProperty(dataItem.row+ "")) {
      dMap[dataItem.row + ""][colIdentifier] = dataItem.cluster
    }
  });


  if(!schemaMap.hasOwnProperty(colIdentifier)) {
    schema.push( {name:colIdentifier,
      type:"factor",
      group:"analytics",
      group_type:"clustering",
      displayOnLoad: false
    });
    schemaMap[colIdentifier] =  schema[schema.length-1];
  } else {
    console.log("Warnign clustering column already exists");
    clusteringLabelExists = true;
  }

  db.storeClustering(colIdentifier,colDataArray, clusteringLabelExists, datasetName);
}

// Add a new column to the main data structrrue
/**
 * Remove a column from the main structure, change will propo0gate thrtough to the databse
 * @param {String} colIdentifier the name of the column to be removed
 */
function removeCol( colIdentifier) {
 var new_d = new Array(dataStore.length),
    new_dMap = {};
 //   new_schema = [],
 //   new_schemaMap = {};

  dataStore.forEach(function(dataItem,index){
    // want to copy the object without the sopecified property  rather than
    // use delete dataItem.colIdentifier
    // trying to keep primary data structure  unmutated
    // and contiguous in memory

    new_d[index] = {};
    for(var dataCol in dataItem) {
      if(dataCol !== colIdentifier) {
        new_d[index][dataCol] = dataItem[dataCol];
      }
    }
    new_dMap[new_d[index].row + ""] = new_d[index];
  });

  dataStore = new_d;
  dMap = new_dMap;
  // schema is smaller and more sturutured so will just splice our row
  schema.splice(schema.findIndex(d => d.name===colIdentifier),1);


  db.reinitialiseDatasetTable(datasetName,datasetName+" reinitialized with column '"+colIdentifier+"' removed",schema,dataStore);

}

/**
 *  function to add tag based on original  ICOVER approach,a a tag is a new column
 * @param {String} tagName name of the tag
 * @param {Array} colDataArray  Array of binary values to indicate whether or not a row in included in the tag
 */
function addTag( tagName, colDataArray) {

  var tagExists = false;
  dataStore.forEach(function(dataItem,index) {

    dataItem[tagName] = colDataArray[index];
  });

  if(!schemaMap.hasOwnProperty(tagName)) {
    schema.push( {name:tagName,
      type:"boolean",
      group:"Tags",
      group_type:"Tags",
      displayOnLoad: false
    });
    schemaMap[tagName] =  schema[schema.length-1];
  } else {
    console.log("Warning tag already exists");
  }

  //ot simplify stroage we woulfd like to prvide DB with row tag valu pairs

  var dbInsertColData = [];
  dataStore.forEach(function(dataItem,index) {

    dbInsertColData.push({row: dataItem.row, tag:colDataArray[index]});

  });


    db.storeTag(tagName, dbInsertColData, tagExists, datasetName);

}

/**
 *removes tag fro data ( change also propagates to DB)
 * @param tagName
 */
function removeTag(tagName) {
  if(schema.findIndex(d => d.name === tagName &&  d.group === "Tags" ) > -1 ){
    removeCol(tagName)
    //db.removeTag(tagName, datasetName);
  }

}
function getDatasetList(cb){
  db.getDatasetList(cb);
}
function getDataset(cb){
  db.getDatasetList(function(datasetList){
    const dataset=datasetList.filter(dataset=>{
      return dataset.name===datasetName;
    })[0];
    cb(dataset);
  })
}
function initDB(){
  db.createDatasetTableIfNecessary(()=>{
    loadData();
  })
}
initDB();



//module.exports.loadDatafromCSV = loadDatafromCSV;
module.exports.data = function() {return dataStore};
module.exports.schema = function() {return schema};
module.exports.dimensions = function() {return {rows:rowCount, cols:colCount}};
module.exports.idFieldName = function() {return idFieldName;};
module.exports.dataLoaded =  function () {return dataIsLoaded };
module.exports.loadData = loadData;
module.exports.loadDataFromDB = loadDatafromDB;

//module.exports.filterCols = filterCols;
//module.exports.filter = filter;
module.exports.addCol = addCol;
//module.exports.get = get;
module.exports.addTag = addTag;
module.exports.removeTag = removeTag;
module.exports.getSchemaVariableNames = getSchemaVariableNames;
module.exports.getDatasetList = getDatasetList;
module.exports.getDataset = getDataset;
module.exports.importUploadedDataset = importUploadedDataset;
