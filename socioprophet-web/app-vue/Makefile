APP_DIR := socioprophet-web_full_ui_r1
YARN := yarn --cwd $(APP_DIR)

.PHONY: install typecheck build check

install:
$(YARN) install --frozen-lockfile

typecheck:
$(YARN) typecheck

build:
$(YARN) build

check: install typecheck build
