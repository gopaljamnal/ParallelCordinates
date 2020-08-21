# dont forget to make this script executable
#  sudo chmod +x ./start_python_server.sh

# kill any running instances
kill $(ps -ef | grep [p]ython_data_server | awk '{print$2}')

nohup python3 ./python_data_server.py > ./python_server.log &
