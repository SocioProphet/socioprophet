# Welcome to SocioProphet

This repository contains the code for the SocioProphet website (https://socioprophet.com), split into /client and /server directories. This codebase is currently a work in progress.

### Directory Layout

- Root directory contains the client and server directories and a scripts directory for working with socioprophet-web.

- `/client` - React 18 application using TypeScript, Webpack and Styled Components.
- `/server` - Express application currently serving the HackerNews RSS feed to the scrolling ticker on the SocioProphet website.
- `/scripts` - Executed via the Makefile in the root directory. To help with installing and running the client and server code concurrently.

### Building with the Makefile and Yarn

socioprophet-web can be built and run using the Makefile within the project root directory. The commands executed by the Makefile are the same commands one would use to build a project and run the Webpack dev server and Node server.

```bash
.PHONY: install_web run_web

# install dependencies for client and server concurrently
install_web:
	cd socioprophet-web/scripts/ && bash install_web.sh

# run client and server
run_web:
	cd socioprophet-web/scripts/ && bash run_web.sh
```

To build and run the socioprophet-web application, run the following commands in the root directory:

```bash
# install client and server dependencies
make install_web

# run client and server locally concurrently
make run_web
```

### Env Variables

Create a `.env` in both the client and server folders. Check `./client/.env.example` and `./server/.env.examples` for details.
## Philosophy

- Liberty by Design: docs/philosophy/liberty-by-design.md

