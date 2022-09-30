#!/usr/bin/make -f

.PHONY : build clean install uninstall
.DEFAULT_GOAL := help

UUID = runcat@kolesnikov.se
LOCAL = $(HOME)/.local/share/gnome-shell/extensions

js_sources = $(shell find src -maxdepth 1 -type f -name '*.js')

build: clean
	mkdir -p dist/
	gnome-extensions pack -f src/ \
		$(addprefix --extra-source=../, $(js_sources)) \
		--extra-source=./dataProviders \
		--extra-source=./resources \
		--extra-source=../assets \
		--extra-source=../LICENSE \
		-o dist/

clean:
	rm -rf dist

install: uninstall build
	gnome-extensions install dist/$(UUID).shell-extension.zip --force
	gnome-extensions enable $(UUID) || true
	echo "You need to restart GNOME Shell to apply changes"

uninstall:
	gnome-extensions uninstall $(UUID) || true


open-prefs:
	gnome-extensions prefs $(UUID)

spawn-gnome-shell:
	env MUTTER_DEBUG_DUMMY_MODE_SPECS=1600x800 \
	 	MUTTER_DEBUG_DUMMY_MONITOR_SCALES=1 \
		dbus-run-session -- gnome-shell --nested --wayland


help:
	@echo -n "Available commands: "
	@$(MAKE) -pRrq -f $(lastword $(MAKEFILE_LIST)) : 2>/dev/null | awk -v RS= -F: '/^# File/,/^# Finished Make data base/ {if ($$1 !~ "^[#.]") {print $$1}}' | sort | egrep -v -e '^[^[:alnum:]]' -e '^$@$$' | xargs
