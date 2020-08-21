 # dont forget to make this script executable
#  sudo chmod +x ./start.sh
# start script assumes all project servers are in default subfolders of the home directory

# use following block if python server is in use
cd ~/lamda-python-app
./start_python_server.sh
cd ~

cd ~/lamda-server-app
./start_node.sh

