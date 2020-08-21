import requests
import pandas as pd

#%%
    
df_data  = pd.read_csv('../../lamda-server-app/data/rolling_resistance_static_db.csv', index_col=0)

"""
Dropping some incomplete/bad-formatted features
"""
df_data        = df_data.drop(['CORRECTING_TEMPERATURE_0C','CAMBER_ANGLE_DEG', 'GROSS_ROLL_RES_N','SPEED_KMH', 'TEMP_CORR_GROSS_ROLL_RES_N',
                   'TEMP_CORR_NET_ROLL_RES_N','ROLL_RES_GRADE','TEST_SURFACE'], axis=1)
df_data        = df_data.dropna() # Just for testing. Similarity requires non nan values.


#%%
rawData = dict()
rawData['tire_id'] = 19225               # Query tire

rawData['df_data']  = df_data.to_json()         # Dataset without nan values
rawData['k']        = 10                  # Number of tires to retrieve
rawData['features'] = df_data.columns[1:].to_list() # Similarity wrt this features

#%%
"""
Post request, answer
"""

r             = requests.post('http://127.0.0.1:5000/clinical_kernel.compute_knn_test', json = rawData)
df_res        = pd.read_json(r.json())

#%%

print("Query tire (Construction number): ",df_data.loc[rawData['tire_id']]['CONSTRUCTION_NUMBER'])
print(df_res.sort_values(by='dist_to_query'))

