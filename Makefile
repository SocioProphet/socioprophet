.PHONY: install_web run_server run_client build_client

# install dependencies for client and server concurrently
install_web:
	cd socioprophet-web/scripts/ && bash install_web.sh

# run client and server 
run_web:
	cd socioprophet-web/scripts/ && bash run_web.sh

# local run server
run_server:
	cd socioprophet-web/scripts/ && bash run_server.sh

# local run client
run_client:
	cd socioprophet-web/scripts && bash run_client.sh

# build client
build_client:
	cd socioprophet-web/scripts && bash build_client.sh

deploy_client:
	cd socioprophet-web/scripts && bash deploy_client.sh

deploy_server:
	cd socioprophet-web/scripts && bash deploy_server.sh