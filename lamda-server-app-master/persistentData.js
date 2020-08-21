/*
    LAMDA - Server
    
    Copyright 2019 Luxembourg Institute of Science and technology <tto@list.lu>.
                   All rights reserved.
*/

/**
 * Simple module to store data in a SQLite Db
 * to allow changes to data persist for the multiariate analytics tool
 *
 * @module persistentData
 * @author Fintan McGee (LIST) fintan.mcgee@list.lu
 */

// created by Fintan McGee 26/07/2019

var currentDataSetName ;

// Using sql lit to persist clusterings and tags
var logger = require('./serverLogging.js');
var sqlite3 = require('sqlite3').verbose(); // verbose to be remove at a l later date
var data =  require('./data.js')

var db = new sqlite3.Database('./db/multivariateToolPersistentData.db', (err) => {
  if(err) {
    console.log("Error setting up sqliteDB for persistent data" + JSON.stringify(err));
  }
  // InitialiseTables();
  // createDataSetInfo("TESTDataSet")
})

/**
 * A simple error handling callback that logs and erro if there is one.
 * returning a function to allow caller information to be passed to the call back
 * @param caller {String} Details of where this error function was called from to be used in the log messgae
 * @returns {Function} a function to be used as a callback for DBs ( error logging only)
 * @author Fintan McGee (LIST) fintan.mcgee@list.lu
 */
function dbErrFunc(caller) {

  return function(err){
    logger.debug_log("Finished DB call: " + caller )
    if(err) {
      logger.log("DB setup: Error called from " + (caller || "unspecified caller ")+ ": " + JSON.stringify(err) + " " + err.message);
    }
  }
}


/**
 * Creates a new table in the data base to store the input data set and another to store it's scheme
 * function only does this if a table of the same name does not exist
 * Table create is asynchronous o function will return before the tbales are crated
 * @param datasetName {String}  name to the dataset ( i.e. table) to be updated
 * @param datasetSchema {Object} schema object to be inserted into DB ( the schema of the application data being visualized)
 * @param dataset {Object} data object to be inserted into DB ( the application data being visualized)
 * @author Fintan McGee (LIST) fintan.mcgee@list.lu
 */
module.exports.initialiseDatasetTable = function(datasetName, shortDescription, datasetSchema, dataset,cb) {
  var tableExistsSQL = "SELECT name FROM sqlite_master WHERE type='table' AND name= ?";
  var datasetQueryCols = ["row"] ; // flat array containing col names and their types to be added to sqlquery start always with row col
  var schemaQueryVariables = [];
  // TODO: !!! Warning!!! is it supposed that structure of the schema table is given by the schema file ?
  //  NM: it could be build during extractMetadataFromCSVFile() id data.js
  if(datasetSchema.length) {
    // NM: do not wrap here but when creating sql query
    // NM: push schema colNames in schemaQueryVariables and use it to preserve consistent order to build dataSchema2D for schema insertion
    // NM: push in  in schemaQueryVariables the metadata keys
    // (name, type, group, group_type etc. see data.extractMetadataFromCSV)
    for( var schemaLabel in datasetSchema[0]) {
        schemaQueryVariables.push(schemaLabel);
    }
  }

  // create
  var initialiseSchemaTableSQL = "CREATE TABLE IF NOT EXISTS " + datasetName + "_schema (" + " row INTEGER PRIMARY KEY";
  // TODO: !!! Warning!!! is it supposed that structure of the schema table is given by the schema file ?
  //  NM: it could be build during extractMetadataFromCSVFile() id data.js
  schemaQueryVariables.forEach(schemaLabel=>{
  // for( var schemaLabel in datasetSchema[0]) {
    initialiseSchemaTableSQL  += ", \"" + schemaLabel + "\" TEXT "
  });
  initialiseSchemaTableSQL += ");";

  var initialiseDataSetTableSQL = "CREATE TABLE IF NOT EXISTS " + datasetName + " (" +  " row INTEGER PRIMARY KEY";

  var dataSchema2D = []; // instead of array of object

  // NM: iterate on each column
  datasetSchema.forEach(function(schemaItem) {
    // NM: TODO  types numeric and integer are defined even if exists character values (It works only with SQLite! Error for any other DBMS)
    // mapping input attribute types to DB types
    var itemDBType = "TEXT";
    if(schemaItem.type === "integer") {
      itemDBType = "INTEGER"
    }else if(schemaItem.type === "numeric") {
      itemDBType = "REAL";
    }
    // NM: do not wrap here but just when creating sql query: wrapping with quotes prevent issues where variables names match SQL keywords , e.g. group
    // NM: datasetQueryCols.push( "\"" + schemaItem.name + "\"");
    // NM: push colNames in datasetQueryCols and use it to preserve consistent order to build data2D for data insertion
    if( schemaItem.name!=="row") {
      datasetQueryCols.push(schemaItem.name);
      initialiseDataSetTableSQL += ",  \"" + schemaItem.name + "\" " + itemDBType;
    }

    // NM: if "row" exists in schemaQueryVariables, it must be added in the "schema" table
    var rowArray = [];
    // covertering array od named object porperties into array of arrays
    // NM: use schemaQueryVariables to ensure consistent order for schema instertion
    schemaQueryVariables.forEach(schemaColName=>{
    // for(var schemaColName in schemaItem) {
        rowArray.push(schemaItem[schemaColName]);
    });
    dataSchema2D.push(rowArray);
  });// end datasetSchema

  initialiseDataSetTableSQL += ");";

  // covertering array od named object porperties into array of arrays
  var data2D = [];
  dataset.forEach(function(dataRow){
    // N:B: Object.values(row) is not supported in older versions of node of node
    // so doin' this the old fashioned way.
    // data2D.push(Object.values(row))
    var rowArray = [];
    // NM: !!! Warning!!! Avoid consider that order of Object.keys and Object.values are consistent ! Why not using object[key] instead ?
    // rowArray.push(dataRow.row); // put row as first column
    // for(var colName in dataRow) { // keys of dataRow are colNames in the dataset
    //   if(colName !== "row") {
    //     rowArray.push(dataRow[colName])
    //   }
    // }
    // NM: use datasetQueryCols to ensure consistent order for data instertion
    datasetQueryCols.forEach(colName=>{
      rowArray.push(dataRow[colName])
    });
    data2D.push(rowArray);
  });

  // wrapping colNames with quotes prevent issues where variables names match SQL keywords , e.g. group
  var insertSQL = "INSERT INTO " + datasetName + "(" + datasetQueryCols.map(colName=>{return  "\""+colName+"\""}).join(',') + ")" + " VALUES  (";
  var insertSchemaSQL = "INSERT INTO " + datasetName + "_schema (" + schemaQueryVariables.map(colName=>{return  "\""+colName+"\""}).join(',') + ")" + " VALUES  (";

  // creat placeholder string of form  VALUES (?,?,?, ... ?,?,?),(?,?,?, ... ?,?,?)...(?,?,?, ... ?,?,?);
  var singleRow = data2D.slice(0,1); // use first row to build prepare statement query string
  insertSQL += singleRow.map(row => row.map(r => "?").join(",") ).join("),\n(") + ");";
  // doing same for schema
  singleRow  = dataSchema2D.slice(0,1);// use first row to build prepare statement query string
  insertSchemaSQL += singleRow.map(row => row.map(r => "?").join(",") ).join("),\n(") + ");";

  // starting the DB queries, one after each other

  logger.log("Schema sql:" + initialiseSchemaTableSQL);
  logger.log("Data sql:" + initialiseDataSetTableSQL);
  db.serialize(() => {
    db.get(tableExistsSQL, [datasetName], function(err, row){
      if(!err) {
        if((!row) || ((row) && row.name !==datasetName)) {
          // only create the tables if they done exist
          db.serialize(() => {
            db.run(initialiseSchemaTableSQL, [], dbErrFunc("schema table initialisation"))
              .run(initialiseDataSetTableSQL, [], (err) => {
                if (err) {
                  logger.log("Error creating data table" + JSON.stringify(err) + " " + err.message);
                  cb(err,null)
                } else {
                  db.serialize(() => {
                    var stmt;
                    db.run("BEGIN TRANSACTION", [],dbErrFunc("Data SCHEMA Insert TXN start"));
                    stmt= db.prepare(insertSchemaSQL);
                    dataSchema2D.forEach(dataRow => {
                      stmt.run(dataRow);
                    });
                    stmt.finalize(dbErrFunc("Data Insert Finalise"));
                    // db.run("COMMIT TRANSACTION", [],dbErrFunc("Data SCHEMA Insert TXN COMMIT "));
                    logger.debug_log("Data SCHEMAInsert Transaction COMMITed finalization ");

                    // db.run("BEGIN TRANSACTION", [],dbErrFunc("Data Insert TXN start"));
                    stmt= db.prepare(insertSQL);
                    data2D.forEach(dataRow => {
                      stmt.run(dataRow);
                    });
                    logger.debug_log("starting finalization for Data Insert TXN ");
                    stmt.finalize(dbErrFunc("Data Insert Finalise"));
                    logger.debug_log("Ending finalization ");
                    db.get("INSERT INTO dataset(name,short_desc) VALUES(?,?)", [datasetName,shortDescription], dbErrFunc("Insertion of dataset row (" +  datasetName + "," +shortDescription+")"));
                    db.run("COMMIT TRANSACTION", [],dbErrFunc("Data Insert TXN COMMIT "));
                    logger.debug_log("Data Insert Transaction COMMITed finalization ");

                    // normally would create an index, but as we are using row as a primary key
                    // it is automatically indexed so no need
                    currentDataSetName = datasetName;
                    //logger.log("Table \"" + datasetName +"\"" + " saved to DB" );
                    cb(null,{tableExist:false})
                  });
                }
              });
          });
        } else {
          logger.log("Table " + datasetName + " already exsits in DB");
          cb(null,{tableExist:true})
        }
      } else {
        logger.log("Error creating dataset initial record Record" + JSON.stringify(err) + " " + err.message);
        cb(err,null)
      }
    });
  });
}

/**
 * Reinitialises data set by deleting exsiting tables in the database with the dataset name
 * and then initialising them with the current data set
 *  Used as a way to remove columns from the DB as sqlite does not allow
 *  ALTER TABLE DROP column_name
 * @param datasetName {String}  name to the dataset ( i.e. table) to be updated
 * @param datasetSchema {Object} schema object to be inserted into DB ( the schema of the application data being visualized)
 * @param dataset {Object} data object to be inserted into DB ( the application data being visualized)
 * @author Fintan McGee (LIST) fintan.mcgee@list.lu
 */
module.exports.reinitialiseDatasetTable = function(datasetName, shortDescription, datasetSchema, dataset) {
  var deleteTableSQL = "Drop TABLE " + datasetName + "; DROP TABLE " + datasetName + "_schema;";

  db.exec(deleteTableSQL, function(err){
    if(err) {
      logger.log("Error deleting Exsiting tables " + JSON.stringify(err) + " " + err.message);
    }else {
      module.exports.initialiseDatasetTable(datasetName, shortDescription, datasetSchema, dataset);
    }

  });
};


/**
 * Adds a column of data to the database, usual a tag or clustering
 * @param datasetName {String}  name to the dataset ( i.e. table) to be updated
 * @param colName {String} the name of the new column to be added to the data set
 * @param colData {Array} An array containing the values for the new column. The length of the array should math the number of rows in the database
 * Entries in the array should only constian a row and data values
 * @author Fintan McGee (LIST) fintan.mcgee@list.lu
 * */
function addColumn(datasetName,colName, colType, colGroup, colGroupType, colData){

  // Creation SQL,o0f ALTER TABLE table_name ADD new_column_name column_definition;

  var addColumnSQL = "ALTER TABLE " + datasetName + " ADD \"" + colName + "\" TEXT;";

  var upateDataSQL = "UPDATE " +  datasetName + " SET "  +  colName+  " = ? WHERE row =  ?;";

  var schemaQueryVariables = data.getSchemaVariableNames();
  var colVarName = "cluster";

  for(varName in colData[0]) {
    if(varName !== "row") {
      colVarName = varName;
    }
  };
  var addSchemaRowSQL = "INSERT INTO " + datasetName + "_schema (" + schemaQueryVariables.join(',') + ")" + " VALUES  (";
  addSchemaRowSQL +=  schemaQueryVariables.map(r => "?").join(",") + ");";
  var data2D = [];
  colData.forEach(d =>
    data2D.push([d[colVarName],d.row])
   //data2D.push([d[colName],parseInt(d.row)])
  );
  var schemaData = [colName,colType,colGroup,colGroupType, "false"];

  // starting the DB queries, one after each other
  // if colData is specified it must be the saem as thge data set length


  db.serialize(() => {

    db.get(addColumnSQL,[], function(err,row) {
      if(!err){
        //if((!row) || ((row) && row.name !==datasetName)) {
        db.serialize(() => {
          var stmt;
          db.run("BEGIN TRANSACTION", [],dbErrFunc("Data new Columm Update Insert TXN start"));
          stmt= db.prepare(upateDataSQL);
          logger.debug_log(upateDataSQL);
          data2D.forEach(d => {stmt.run(d)});
          stmt.finalize(dbErrFunc("Data new Columm Update Finaliye called"));
          db.run("COMMIT TRANSACTION", [],dbErrFunc("Data new Columm  TXN COMMIT "));
          logger.debug_log("New Column Data Insert Transaction COMMITed finalization ");

        });
      }
    }).get(addSchemaRowSQL,schemaData, dbErrFunc("Finished Adding SchemaRow "));
  });
};



/**
 * Update column of data in the database, usually a tag or clustering overwriting a previous name. Assume the column exists
 * @param datasetName {String}  name to the dataset ( i.e. table) to be updated
 * @param colName {String} the name of the new column to be added to the data set
 * @param colData {Array} An array containing the values for the new column. The length of the array should math the number of rows in the database
 * Entries in the array should only constian a row and data values
 * @author Fintan McGee (LIST) fintan.mcgee@list.lu
 * */
function updateColumn(datasetName,colName, colType, colGroup, colGroupType, colData){
  var upateDataSQL = "UPDATE " +  datasetName + " SET "  +  colName+  " = ? WHERE row =  ?;",
   data2D = [],
   colVarName = "cluster";
  for(varName in colData[0]) {
    if(varName !== "row") {
      colVarName = varName;
    }
  };

  colData.forEach(d =>data2D.push([d[colVarName],d.row]));
  db.serialize(() => {
    var stmt;
    db.run("BEGIN TRANSACTION", [],dbErrFunc("Data Update Columm Update Insert TXN start"));
    stmt= db.prepare(upateDataSQL);
    logger.debug_log(upateDataSQL);
    data2D.forEach(d => {stmt.run(d)});
    stmt.finalize(dbErrFunc("Data new Columm Update Finalize called"));
    db.run("COMMIT TRANSACTION", [],dbErrFunc("Data new Columm  TXN COMMIT "));
    logger.debug_log("Update Column Data Insert Transaction COMMITed finalization");
  });


};

/**
 * Adds a column of data to the database, usual a tag or clustering
 * @param datasetName {String}  name to the dataset ( i.e. table) to be updated
 * @param colName {String} the name of the new column to be added to the data set
 * @param colData {Array} An array containing eh values for the new column. The length of the array should math the number of rows in the database
 * @author Fintan McGee (LIST) fintan.mcgee@list.lu
 * */
function removeColumn(colName,datasetName){

  // Creation SQL,o0f ALTER TABLE table_name ADD new_column_name column_definition;

  var addColumnSQL = "ALTER TABLE " + datasetName + " ADD \"" + colName + "\" TEXT;";

  var upateDataSQL = "UPDATE " +  datasetName + " SET "  +  colName+  " = ? WHERE row =  ?;";

  var schemaQueryVariables = data.getSchemaVariableNames();
  var addSchemaRowSQL = "INSERT INTO " + datasetName + "_schema (" + schemaQueryVariables.join(',') + ")" + " VALUES  (";
  addSchemaRowSQL +=  schemaQueryVariables.map(r => "?").join(",") + ");";
  var data2D = [];
  colData.forEach(d =>
      data2D.push([d.cluster,d.row])
    //data2D.push([d[colName],parseInt(d.row)])
  );
  var schemaData = [colName,colType,colGroup,colGroupType, "false"];

  // starting the DB queries, one after each other
  // if colData is specified it must be the saem as thge data set length


  db.serialize(() => {

    db.get(addColumnSQL,[], function(err,row) {
      if(!err){
        //if((!row) || ((row) && row.name !==datasetName)) {
        db.serialize(() => {
          var stmt;
          db.run("BEGIN TRANSACTION", [],dbErrFunc("Data new Columm Update Insert TXN start"));
          stmt= db.prepare(upateDataSQL);
          logger.debug_log(upateDataSQL);
          data2D.forEach(d => {stmt.run(d)});
          stmt.finalize(dbErrFunc("Data new Columm Update Finaliye called"));
          db.run("COMMIT TRANSACTION", [],dbErrFunc("Data new Columm  TXN COMMIT "));
          logger.debug_log("New Column Data Insert Transaction COMMITed finalization ");

        });
      }
    }).get(addSchemaRowSQL,schemaData, dbErrFunc("Error Adding SchemaRow "));
  });
};
/**
 * Adds a column of data to the database that stores tag information and update schema accoringly
 *
 * @param tagName {String} the name of the new column to be added to the data set for the tag
 * @param colDataArray {Array} An array containing the row IDs for the tag
 * @param datasetName {String}  name to the dataset ( i.e. table) to be updated
 * @author Fintan McGee (LIST) fintan.mcgee@list.lu
 * */
module.exports.storeTag = function(tagName, colDataArray, tagExists,datasetName) {
  if(tagExists) {
    updateColumn(datasetName, tagName, "boolean", "Tags", "Tags", colDataArray);
  }else {
    addColumn(datasetName, tagName, "boolean", "Tags", "Tags", colDataArray);
  }
};

/**
 * Removes the specified tag column from DB data table and row from schema table
 * @param tagName {String} the name of the new column to be added to the data set for the tag
 * @param datasetName {String}  name to the dataset (i.e. table) to be updated
 * @author Fintan McGee (LIST) fintan.mcgee@list.lu
 * */
module.exports.removeTag = function (tagName, datasetName) {
  removeColumn(tagName, datasetName);
};
/**
 * Adds a column of data to the database that stores clustering information and updates schema accordingly
 *
 * @param clusteringName {String} the name of the new column to be added to the data set for the tag
 * @param clusterIDMap {Array} An array containing the values for the new column . uis a map between row ID an cluster_id
 * @param datasetName {String}  name of the dataset ( i.e. table) to be updated
 * @author Fintan McGee (LIST) fintan.mcgee@list.lu
 * */
module.exports.storeClustering = function (clusteringName, clusterIDMap, clusteringLabelExists, datasetName) {

  if(clusteringLabelExists) {
    updateColumn(datasetName, clusteringName, "factor", "Analytics", "Clusterings", clusterIDMap);
  } else {
    addColumn(datasetName, clusteringName, "factor", "Analytics", "Clusterings", clusterIDMap);
  }
};
/**
 * Removes the specified cluster columnrom DB data table and row from schema table
 * @param clusteringName {String} the name of the new column to be added to the data set for the tag
 * @param datasetName {String}  name of the dataset (i.e. table) to be updated
 * @author Fintan McGee (LIST) fintan.mcgee@list.lu
 * */
module.exports.removeClustering = function(clusteringName, datasetName) {
  removeColumn(clusteringName,datasetName);
};


/**
 * Checks if the table exists (asyncronoously ,) and calls next function  with paprameters err, tableExists if it does
 * @param tableName {String}
 * @param nextFunc {Function} function of the form (err,tableExists) where table exists is a boolean indicating whether or not the table exists in the DB
 * @author Fintan McGee (LIST) fintan.mcgee@list.lu
 * */
module.exports.tableExists = function(tableName, nextFunc) {

  var tableExistsSQL = "SELECT name FROM sqlite_master WHERE type='table' AND name= ?";
  db.serialize(() => {
    db.get(tableExistsSQL, [tableName], function (err, row) {
        if(err) {
          logger.log("Error checingfor Exiting table " +  tableName);
          nextFunc(err,false);
        }
        else  if( row && row.name ===tableName) {

          nextFunc(null,true);
        }
        else {
          nextFunc(null,false);
        }
    });

  });
}
/**
 * Loads a dataset and its associated shcema form the DB
 * @param tableName {String} name of the dataset to be loaded
 * @param {Function} First parameter is the data set, the second is the dataset schema
 * @author Fintan McGee (LIST) fintan.mcgee@list.lu
 * */
module.exports.loadData = function(datasetName, nextFunc) {

  var d = [], schema = [];
  var dataSchemaQuery = "select * from " + datasetName + "_schema";
  var dataQuery  =  "select * from " + datasetName;
  db.serialize(() => {
    db.each(dataSchemaQuery, [], function (err, row) {

      //  logger.log("Found item " + JSON.stringify(row));
      schema.push( {name:row.name,
        type:row.type,
        group:row.group,
        group_type:row.group_type,
        displayOnLoad: row.displayOnLoad === "1" || row.displayOnLoad === 1 || row.displayOnLoad === "true" || row.displayOnLoad === "TRUE"
      });
      // schemaMap[dataRow.name] = schema[schema.length-1];
      // if(dataRow.group === "Id") {
      //   idFieldName = dataRow.name;
      // }
    })
      .all(dataQuery,[], function (err, row) {
       // console.log("Found item " + JSON.stringify(row))
        d = (row)
        logger.log("Rerieve Data set ");

        nextFunc(d,schema)
      });

    console.log("End Serialise");
  });
};

module.exports.createDatasetTableIfNecessary=function(cb){
  module.exports.tableExists("dataset",function(err,exists){
    if(!exists) {
      var createDataSetTableSQL = "CREATE TABLE IF NOT EXISTS dataset ( id INTEGER PRIMARY KEY, name TEXT UNIQUE, short_desc TEXT)";
      db.all(createDataSetTableSQL, function(err){
        if(err) {
          logger.log("Error creating table dataset " + JSON.stringify(err) + " " + err.message);
        }else {
          cb();
        }

      });
    }else{
      cb();
    }
  });
};

module.exports.getDatasetList=function(cb){
    var getDatasetSql = "SELECT * FROM dataset";
    db.all(getDatasetSql, function(err,dataRows){
      if(err) {
        logger.log("Error getting datasets" + JSON.stringify(err) + " " + err.message);
      }else {
        cb(dataRows);
      }

    });
};

