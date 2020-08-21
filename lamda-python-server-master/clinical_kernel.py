#!/usr/bin/env python
# coding: utf-8

import numpy as np
from sklearn.metrics import pairwise_distances
from sklearn.metrics.pairwise import pairwise_kernels
from sklearn.neighbors import NearestNeighbors
import pandas as pd
import category_encoders as ce
import json
#%%
""" 
Compute the similarity between features x and y
Input: x, y features
Outpiut: similarity between x and y
"""
def k_xy(x, y, max_min, type=0):
    
    if type==0: # continuous
        
        sim_fuc = (max_min - np.abs(x - y))/max_min 
                
    else: # categorical
        sim_fuc = 1 if x == y else 0
    return sim_fuc

#%%
"""
Computed the clinical kernel for two tires

Input: 
tir1: 1 x p vector of tire features (cat variables should be ordinal encoded)
tir2: 1 x p vector of tite features (cat variables should be ordinal encoded)
features: 1 x p list of features names 
max_min: 1 x p vector of max - min values for all features

Out:
K = 1/p (k1 + k2 + ... + kp) \in R

"""
def K_clinical_xy(tir1, tir2, max_min, cat_indexes):
    
    
    abs_diff = np.abs(tir1 - tir2)
    
    res_k = (max_min - abs_diff)/max_min
    
    mask = (tir1==tir2)[cat_indexes]*1
    
    res_k[cat_indexes] = mask
        
    return res_k.mean()

#%%
"""
Same than before, but distance

"""

def dist_clinical_xy(tir1, tir2,  max_min, cat_indexes):

    
    abs_diff = np.abs(tir1 - tir2)
    
    res_k = 1 - (max_min - abs_diff)/max_min
    
    mask = (tir1!=tir2)[cat_indexes]*1
    
    res_k[cat_indexes] = mask
    
    return np.sqrt(res_k.sum())

# In[2]:

"""
Input:
    X_cat:    dataset with m tires and p features ordinaled encoded
    cat_var:  List of categorical feature names
    
"""
def clinical_distance_matrix(X_cat, max_min, cat_var, save=None):
    
    print('Computing clinical distance matrix...')
    problem_feats = [X_cat.columns[i] for i in range(0,len(max_min)) if max_min[i]==0]
    
    if len(problem_feats)>0:
        print("*** Problematic features ", problem_feats)
        print("\n")
        
    cat_indexes    = [list(X_cat.columns).index(cv) for cv in cat_var]
    
    dist_clinical_xy2 = lambda x, y: dist_clinical_xy(x,y, max_min=max_min, cat_indexes=cat_indexes)

    dd_mat = pairwise_distances(X_cat.values, metric=dist_clinical_xy2)
    
    #if not(save is None):
    #    np.savetxt(KERNELS_PATH+save, dd_mat,  fmt='%1.3f')
    
    return dd_mat

#%%
"""
Input:
    X_cat:    dataset with m tires and p features ordinaled encoded
    cat_var:  List of categorical feature names
    
"""
def clinical_kernel_matrix(X_cat, max_min, cat_var, save=None):
    
    print('Computing clinical kernel...')
    problem_feats = [X_cat.columns[i] for i in range(0,len(max_min)) if max_min[i]==0]
    
    if len(problem_feats)>0:
        print("*** Problematic features ", problem_feats)
        print("\n")
        
    cat_indexes    = [list(X_cat.columns).index(cv) for cv in cat_var]
    
    K_clinical_xy2 = lambda x, y: K_clinical_xy(x,y, max_min=max_min, cat_indexes=cat_indexes)


    kk_mat = pairwise_kernels(X_cat.values, metric=K_clinical_xy2)
    
    #if not(save is None):
    #    np.savetxt(KERNELS_PATH+save, kk_mat,  fmt='%1.3f')

    
    return kk_mat


def compute_knn(df_data, id_col_name, df_row_index_ref, k, features, virtual_values_ref=None):
    """
    Return the k nearest neighbors given one object of reference.
    
    Parameters
    ----------
    df_data : DataFrame
        the dataframe containing at least the columns referenced by id_col_name and features
    id_col_name : str
        The name of the identifier column
    df_row_index_ref : int
        The row index in the df_data DataFrame used as reference to search the nearest neighbors
    k : int
         The number of nerest neighbors to search
    features : list
        A list of features to consider to compute the similarity
    virtual_values_ref: list
        A list of values (positions correspond to features) used as a reference for searching k nearest neighbors.
        None by default.

    Returns
    -------
        DataFrame:
            A DataFrame object containing the k nearest neighbors. The first is the reference row and then the neighbors are sorted by similarity.
    """

    # TODO: add the possibility to choose between both df_row_index_ref or virtual_ref_values array of values

    """
    Geetting data from the frontend and encoding categorical variables
    """

    # Encoding categories as ordinal variables
    # X_cat:    dataset with m tires and p features ordinaled encoded
    # cat_var:  List of categorical feature names
    # remove row column (identifier for the rows). It will be added at the end
    X_cat, cat_var, ohe =  encode_ordinal_features(df_data.drop(id_col_name, axis=1))
    max_min             =  X_cat.max().values - X_cat.min().values
    problem_feats       =  [X_cat.columns[i] for i in range(0,len(max_min)) if max_min[i]==0]
    
    if len(problem_feats)>0:
        print("*** Problematic features ", problem_feats)
        print("\n")
            
    #print(X_cat.head(10))
    #print(features)
    
    """
    Selecting tire features
    """
    
    query_features = [f for f in features]    
    feat_indexes   = [list(X_cat.columns).index(fi) for fi in query_features]
    X_cat          = X_cat[query_features]
    max_min        = max_min[feat_indexes]
    cat_indexes    = [list(X_cat.columns).index(cv) for cv in cat_var if cv in X_cat.columns]

    query_inx      = int(df_row_index_ref)           # index of data.features DataFrame
    query_tire     = X_cat.loc[query_inx]
    
    """
    Computing nearest neighbors
    """
    n_neighbors = k
    if virtual_values_ref is None:
        # use k+1 because the df_row_index_ref exists in the dataset so it is taken in the result
        n_neighbors = k+1

    nbrs       =   NearestNeighbors(n_neighbors=n_neighbors, algorithm='brute',  #ball_tree
                          metric= dist_clinical_xy, 
                          metric_params={'max_min': max_min, 'cat_indexes': cat_indexes}, n_jobs=8)
                          
    nnn        =   nbrs.fit(X_cat.values)
    
    distances, indices = nbrs.kneighbors(query_tire.values.reshape(1,-1)) # indices wrt X_cat.values
    map_index          = dict(zip(X_cat.index.ravel(), range(0,X_cat.shape[0])))
    
    if not(map_index[query_inx] in indices):
        indices   = np.concatenate([np.array([[map_index[query_inx]]]), indices], axis=1)
        distances = np.concatenate([np.array([[0]]), distances], axis=1)
        indices   = np.array(indices[0][0:indices.shape[1]-1]).reshape(1,-1)
        distances = np.array(distances[0][0:distances.shape[1]-1]).reshape(1,-1)
 
    #indices_pandas     = X_cat.iloc[indices.ravel()].index.ravel()
    #query_code         = map_index[query_inx]
    
    """
     Decoding and Display retrieved tires wrt a given set of features
    """
    df_out_cat                  = pd.DataFrame(X_cat.iloc[indices.ravel()], columns=X_cat.columns)
    df_out_cat['dist_to_query'] = distances.reshape(-1,1)
    
    df_output                   = ohe.inverse_transform(df_out_cat.drop('dist_to_query', axis=1))
    df_output['dist_to_query']  = df_out_cat['dist_to_query']

    # add identifier column (identifier for the rows) before sending the result.
    df_res                      = pd.concat([df_data.loc[df_output.index][id_col_name], df_output], axis=1)

    if virtual_values_ref is None:
        df_res = df_res.drop([df_row_index_ref])

    return df_res



def compute_knn_json_dict(JSONData):
    """
    Return the k nearest neighbors given one object of reference.

    Parameters
    ----------
    JSONData : str
        A JSON object with tire_id (index of data.features DataFrame to use as reference), k (the number of neighbors to search),
        features (a list of features to consider to compute the similarity) and df-data (a DataFrame converted in json format with to_json() method) .
    Returns
    -------
        str: A JSON object with k nearest neighbors in the following format [{colName:value}] the list is sorted by similarity.

    """
    id_col_name = "row"
    raw_data = json.loads(JSONData)

    row_id = raw_data['row_id']
    k = raw_data['k']
    features = raw_data['features']
    df_data = pd.DataFrame.from_dict(raw_data['df_data'])

    # get index where df[id_col_name] == row_id
    # df_data.set_index(id_col_name)
    indexes=np.flatnonzero(df_data[id_col_name]==row_id)
    df_res=compute_knn(df_data, id_col_name, indexes[0], k, features).sort_values(by='dist_to_query')
    # return a list to preserve order in json => use orient='records'
    # ps: by defautl to_json return a dict converted in Json Object {} which does not guarantee to preserve key order in javascript
    return df_res.to_json(orient='records') # return [{colName:value}]


def compute_knn_json_test(JSONData):
    """
    Return the k nearest neighbors given one object of reference.

    Parameters
    ----------
    JSONData : str
        A JSON object with tire_id (index of data.features DataFrame to use as reference), k (the number of neighbors to search),
        features (a list of features to consider to compute the similarity) and df-data (the dataset as an array of object [{colName:value}]) .
    Returns
    -------
        str: A JSON object with k nearest neighbors in the following format {columnName:{pos:value}}.

    """

    id_col_name = "CONSTRUCTION_NUMBER"
    raw_data = json.loads(JSONData)

    df_data = pd.read_json(raw_data['df_data'])
    df_res=compute_knn(df_data,id_col_name,raw_data['tire_id'],raw_data['k'],raw_data['features'])
    return df_res.to_json()

     
# X: Dataframe data (num examples, num features)
def encode_ordinal_features(X):
    
    cat_var    =  X.select_dtypes(exclude=['int', 'float']).columns.to_list()                
    ohe        =  ce.OrdinalEncoder(cols=cat_var)
    X_cat      =  ohe.fit_transform(X)
    
    return (X_cat, cat_var, ohe)
    
    
