# dont forget to make this script executable
#  sudo chmod +x ./start.sh
kill $(ps -ef | grep [n]ode | awk '{print$2}')

nohup node --max-old-space-size=4096 bin/www  > ./server_console_output.log &