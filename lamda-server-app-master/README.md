# LAMDA-server-app

The node.js server for the base LAMBDA setup.<br>

## Public fodler and submodules
The public folder should contain the pages to be served by the node server. Usually this is a git submodule linked to a lamda-client-app repository.
It has been set up with: <br>
```
git submodule add git@git.list.lu:GY_PROGRAM_5/PROJECT_5.1/WP_5.1.4/lamda/lamda-client-app.git ./public
```

For other projects the above command can be repurposed to point at other respositories, or delete the folder and recreate a new public folder with your pages in it. Regardless a public folder must always exist for the server to run.

To  pull in the client code once you have cloned the server app (and assuming a submodule has been added), when in the public directory,  execute the following commands <br>
``` 
git submodule init<br>
git submodule update<br>
```
## Additional folders: Data and Config 
Two folders need to be created.<br>
The folder `./data`:<br>
* contains the default data set (`.csv` format) loaded when the server start (the name is definde in `config/server.js`).
* contains temporary files starting with `Upload` (e.g. `Upload1583322063521.csv`). One for all other data sets uploaded by the users. These files can be removed for cleaning.

The folder `./config`: <br>
* contains `server.js` which define defaults configurations used by the node server. The most important property for installation is 
`dataFilePath` which refers to the data set to load by default when node server starts.

## Database
During the first start of node server. A SQLite database will be created with the name `mutivariateToolPersistentData.db` in the folder `./db`.
See `./db/readme.md` for more informations. 

## Start node server
Node server provides a REST API on port 3000 and serves the Web Application LAMDA to clients (HTML/CSS + javascript).<br> 
Node server redirects calls for analytic function to the Python server deployed on port 5000 (lamda-python-server). If the python REST API is not available on this port the node server stops.  

Launch the following command to start node server and log the output:<br>
```
nohup node --max-old-space-size=4096 bin/www  > ./server_console_output.log &
```
Alternatively you can start node server with the following scripts:<br>
Node server only: `start_node_server.sh` <br>
Python + Node servers: `start.sh` <br> 
 