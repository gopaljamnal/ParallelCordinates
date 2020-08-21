# LAMDA-python-server

A simple python server that provides clustering and dimensionality reduction functionality for the LAMDA server app.
The REST API is served on port 5000.  

## Install dependencies
The required libraries need to be installed for this server. This is done using PIP which is installed by default with python 3.x.

It is recommended to create specific virtual environment for lamda to avoid any conflict with libraries installed for other application: https://docs.python.org/3/library/venv.html

Once python environment is correctly installed: 
```
cd ~/lamda-python-server
pip install -r requirements.txt
```

## Start python server
```
python python_data_server.py
```

