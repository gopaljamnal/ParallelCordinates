##
#   LAMDA - Python Server
#   
#   Copyright 2019 Luxembourg Institute of Science and technology <tto@list.lu>.
#                  All rights reserved.
##


from flask import Flask, request, jsonify
from dimred  import *
from clustering  import *
from clinical_kernel import compute_knn_json_dict, compute_knn_json_test
import sys
import json

app = Flask(__name__)

@app.route("/")
def hello():
    return "LAMDA Python Data server is running"

@app.route("/dimred.pca.data", methods=['POST'])
def handlePCAReq():
          print("Doing Python PCA analysis",  file=sys.stderr)
          pcaData = request.get_json()
          print("pcaData:   " + json.dumps(pcaData),  file=sys.stderr)
          #print("pcaData:   " + pcaData["data"],  file=sys.stderr)
          
          result = doPCA(json.dumps(pcaData["data"]))
          print("******Finshed PCA****** ",  file=sys.stderr)
          ## print("RESULT:   " + result.to_json(),  file=sys.stderr)
          return jsonify(result)

@app.route("/cluster.kmeans", methods=['POST'])
def handleKMeansReq():
          print("Doing Kmeans Clustering",  file=sys.stderr)
          clusteringInput = request.get_json()
          print("clusteringInput:   " + json.dumps(clusteringInput),  file=sys.stderr)
          #print("pcaData:   " + pcaData["data"],  file=sys.stderr)
          
          result = doKMeans(json.dumps(clusteringInput))
          print("******Finshed KMEANS****** ",  file=sys.stderr)
          ## print("RESULT:   " + result.to_json(),  file=sys.stderr)
          return jsonify(result)


@app.route("/clinical_kernel.compute_knn_test", methods=['POST'])
def handleKnnTestReq():
    print("Doing similarity analysis", file=sys.stderr)
    simData = request.get_json()
    print("similarityData:   " + json.dumps(simData), file=sys.stderr)
    # print("pcaData:   " + pcaData["data"],  file=sys.stderr)

    result = compute_knn_json_test(json.dumps(simData))
    print("******Finshed sim****** ", file=sys.stderr)
    ## print("RESULT:   " + result.to_json(),  file=sys.stderr)
    return jsonify(result)


@app.route("/clinical_kernel.compute_knn", methods=['POST'])
def handleKnnReq():
          print("Doing similarity analysis",  file=sys.stderr)
          simData = request.get_json()
          print("similarityData:   " + json.dumps(simData),  file=sys.stderr)
          #print("pcaData:   " + pcaData["data"],  file=sys.stderr)
          
          result = compute_knn_json_dict(json.dumps(simData))
          print("******Finshed sim****** ",  file=sys.stderr)
          ## print("RESULT:   " + result.to_json(),  file=sys.stderr)
          return jsonify(result)

@app.route("/ping", methods=['POST'])
def handlePing():
          print("Ping Received ",  file=sys.stderr)
          return jsonify({'msg': "Hello world!", 'err':False, 'ip': request.remote_addr})
        
if __name__ == "__main__":
    app.run(port=5000, host='0.0.0.0')
    # app.run()
