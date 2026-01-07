.PHONY: install_web run_web

# install dependencies for client and server concurrently
install_web:
	cd socioprophet-web/scripts/ && bash install_web.sh

# run client and server 
run_web:
	cd socioprophet-web/scripts/ && bash run_web.sh