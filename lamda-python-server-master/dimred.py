##
#   LAMDA - Python Server
#   
#   Copyright 2019 Luxembourg Institute of Science and technology <tto@list.lu>.
#                  All rights reserved.
##

import pandas as pd
##import matplotlib.pyplot as plt
import numpy as np
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler
import json

## the input data
#rawData = pd.read_csv('pythonTestDataset.csv',sep=';')


def doPCA(JSONData):
        #always assume the the first 2 columns are index and label of some kind
        rawData = pd.read_json(JSONData)
        #rawData = pd.DataFrame(JSONData)

        # pcaData=rawData.drop(["row"], axis=1)
        rawData.set_index("row")

        # tmpIsNumeric=rawData.applymap(np.isreal or np.isinteger).all(1) # try lambda x: isinstance(x, (int, float))
        # tmpIsNumeric=rawData.applymap(lambda x: isinstance(x, (int, float))).all(1) # try lambda x: isinstance(x, (int, float))
        # tmpIsNonNumeric=rawData[~tmpIsNumeric]

        # why dropping two first columns ?
        # pcaData = rawData.drop(rawData.columns[[0,1]],axis=1)

        # Drop columns with name = "row" data type str or date
        dataTypeDict = dict(rawData.dtypes)
        columnsToDrop=[]
        for key,value in dataTypeDict.items():
            if value == np.object or value == np.datetime64:
                columnsToDrop.append(key)
        pcaData = rawData.drop(columnsToDrop, axis=1)

        # in addition to pca we do some addtional normalizaiton of the input data set
        # which is also returned in the data result structure
        processedData =  np.square(pcaData); #storing the square of  the raw values here temporaily
        normalised_col_sums = np.sum(processedData,axis=0)
        normalised_col_sums = np.sqrt(normalised_col_sums) # using the above squared vlaues to normalise (euclidean normalisation)
        for i, col_sum in enumerate(normalised_col_sums):
                processedData[processedData.columns[i]] = pcaData[pcaData.columns[i]] /col_sum

        #starting actual PCA
        #scale data for PCA (this is automatically done in some PCA libraires (R for example) but not here)
        x = StandardScaler().fit_transform(pcaData)
        #create PCA object
        pca = PCA(n_components=len(pcaData.columns))
        # do PCA
        res_pca = pca.fit(x).transform(x) # res_pca stores the coordinates of the indivdual observations
        pca_components = pca.components_ # stores the values of the compnents (the PCA dimensions)
        explainedVariance =  pca.explained_variance_ratio_ * 100 # the variance  desibred for eack for each compnenet (expected as a percentage)

        # we need  to calculate the contribution of each individual observation
        # to each dimension
        # this is based on the square of the coordinate of the individual observation ( like the cos2 for the indivdual, but this is not noralised)
        # contribution is percentage of contribution to overall contribution in the component (or dimension)

        contrib = np.square(res_pca);
        col_sums = np.sum(contrib,axis=0) # total contribution of variables for each dimension
        for i, row in enumerate(contrib):
            for j, cell in enumerate(row):
                contrib[i,j] = cell * 100 / col_sums[j]

        ## pca loadings are essentially the coordinates for the variables
        ## derived form the eigne values (explained variance) and the actrual cmoponents
        ## the source of all variable projction data
        ## components matrix must be transposed for this multiplication (hence the .T)
        pca_loadings = pca.components_.T * np.sqrt(pca.explained_variance_)

        # calculating variable contrib
        var_contrib = np.square(pca_loadings) # currently the cos2 value, to be updated to contrib
        loading_sums = np.sum(var_contrib,axis=0)
        for i, row in enumerate(var_contrib):
            for j, cell in enumerate(row):
                var_contrib[i,j] = cell * 100 / loading_sums[j]

       
        ## WARNING  because of python 3 insanity json module cannot
        ## parse numpy numbers therefore we use .item() and tolist()
        ##to convert them to regular numbers below
        ## so the returned data can be easily transformed to JSON

        ##building individual projection data structure
        individualProjectionData = []
        for i, row in enumerate(res_pca):
                # add data to the individual proecjtions array here
                individualProjectionDataItem = {"id":str(rawData.iloc[i,0].item()), # .item is required if theis number will ever be converted to json (not really needed here as we convert to string
                                                 "coord": res_pca[i,:].tolist(),# .tolist is required if array will ever be converted to json 
                                                 "contrib": contrib[i,:].tolist(),
                                                 "label": str(rawData.iloc[i,1])} # N. Medoc: convert to string to avoid int64 error due to numpy conversion
                individualProjectionData.append(individualProjectionDataItem);
        #calulating variable projection data structure        
        variableProjectionData = []
        for i, row in enumerate(pca_loadings):
                # add data to the indovidual projections array here
                variableProjectionDataItem = {"id":pcaData.columns[i],
                                                 "coord": pca_loadings[i,:].tolist(),
                                                 "contrib": var_contrib[i,:].tolist()}
                variableProjectionData.append(variableProjectionDataItem);
                
        result= {"processedData": {"rowNames": rawData[rawData.columns[0]].tolist(),
                                   "columnNames": list(rawData.columns[2:]),
                                   "data": json.loads(processedData.to_json(orient='values'))}, ## todo fiy as this might not be the most efficient way to get the JSON structure
                 "individualProjections":individualProjectionData,
                 "variableProjections":variableProjectionData,
                 "explainedVariance":explainedVariance.tolist(),
                 "method":"pca"}
##        print (json.dumps(result['processedData']['rowNames']))
##        print (json.dumps(result['processedData']['columnNames']))
##        print (json.dumps(result['processedData']['data']))
##        print (json.dumps(result['individualProjections']))
##        print (json.dumps(result['variableProjections']))
##        print (json.dumps(result['explainedVariance']))
        return result
###TestCode
##f = open('drData.json','r')
##testData = f.read()
##res = doPCA(testData)
##print(res)
