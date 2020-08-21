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
from sklearn.cluster import KMeans
from sklearn.cluster import SpectralClustering
import json

## the input data
#rawData = pd.read_csv('pythonTestDataset.csv',sep=';')


def doKMeans(JSONData):
        #always assume the the first 2 columns are index and label of some kind
        rawData = json.loads(JSONData)
        #rawData = pd.DataFrame(JSONData)
#parse jason structre
        #kmeansData = pd.read_json(rawData['clusterData'])
        kmeansData = pd.DataFrame.from_dict(rawData['clusterData'])
        rowIds = kmeansData.iloc[:,0]
  
        kmeansData = kmeansData.drop(kmeansData.columns[[0]],axis=1)

        clusterCount = rawData['centers']
        indentifier =  rawData['identifier']
        kmeans = KMeans(n_clusters=clusterCount)
        clusterIDs= kmeans.fit_predict (kmeansData)
        
        result = []
        for i, row in enumerate(rowIds):
         rowItem = {"row": row,  "cluster": str(clusterIDs[i])}
         result.append(rowItem)
         
        return result

# TODO: Change the name With SpectralClusteringNN  (=kMeans with cosinus distance ?)
def doKMeansNN(JSONData):
        #always assume the the first col is rowID  of some kind
        rawData = json.loads(JSONData)
        kmeansData = pd.DataFrame.from_dict(rawData['clusterData'])
        rowIds = kmeansData.iloc[:,0]
        print(rowIds)
        kmeansData = kmeansData.drop(kmeansData.columns[[0]],axis=1)
        print(kmeansData)
        clusterCount = rawData['centers']
        indentifier =  rawData['identifier']
        kmeans = SpectralClustering(n_clusters=clusterCount, affinity='nearest_neighbors',
                           assign_labels='kmeans')
        clusterIDs= kmeans._predict_fit(kmeansData)
        result = []
        for i, row in enumerate(rowIds):
         rowItem = {"row": row,  "cluster": str(clusterIDs[i])}
         result.append(rowItem)
         
        return result
###TestCode
##f = open('kmeansData.json','r')
##testData = f.read()
##print("K-Means test")
##res = doKMeans(testData)
##print(res)
##print("K-Means Nearest Neighbour Test")
##res = doKMeans(testData)
##print(res)
