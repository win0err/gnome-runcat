#!/usr/bin/make -f

.PHONY : build clean install uninstall
.DEFAULT_GOAL := help

UUID = "runcat@kolesnikov.se"
LOCAL = $(HOME)/.local/share/gnome-shell/extensions

build: clean
	mkdir -p dist build
	cp -r src/* build/
	glib-compile-schemas build/schemas
	cp LICENSE build
	(cd build; zip -qr ../dist/$(UUID).zip .)

clean:
	rm -rf build
	rm -rf dist

install: uninstall build
	gnome-extensions install dist/$(UUID).zip
	echo "You need to restart GNOME Shell to apply changes"

uninstall:
	gnome-extensions uninstall $(UUID) | true

help:
	@echo -n "Available commands: "
	@$(MAKE) -pRrq -f $(lastword $(MAKEFILE_LIST)) : 2>/dev/null | awk -v RS= -F: '/^# File/,/^# Finished Make data base/ {if ($$1 !~ "^[#.]") {print $$1}}' | sort | egrep -v -e '^[^[:alnum:]]' -e '^$@$$' | xargs
