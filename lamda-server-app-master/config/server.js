module.exports = {
	port: 3000,
    analyticsRoute: "python",	 // option are "OCPU" or "python"
	dataFilePath : "/data/rolling_resistance_static_db.csv", // "/data/anonymized_perf_data.csv", // MonJan21105003AM2019_CorrMat.csv", // goodyear_data_test.csv", // location of the input data file , should be specified from node application root folder
	//dataSchemaFilePath: "/data/rolling_resistance_static_db.schema.csv", // "/data/anonymized_perf_data.schema.csv", // MonJan21105003AM2019_CorrMat.schema.csv", // anonymized_perf_data.schema.csv", // goodyear_data_test.schema.csv", // location of the input data schema file , should be specified from node application root folder
//	dataFilePath : "\\public\\data\\cstr.csv", // location of the input data file , should be specified from node application root folder
//	dataSchemaFilePath:"\\public\\data\\cstr.schema.csv", // location of the input data schema file , should be specified from node application root folder
	DEBUG_MODE:false,
	useKeycloakAuthentication:false
	};