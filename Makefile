#!/usr/bin/make -f

.PHONY : build clean install uninstall open-prefs spawn-gnome-shell translations compile
.DEFAULT_GOAL := build

UUID = runcat@kolesnikov.se
DIST_ARCHIVE = $(UUID).shell-extension.zip
LOCAL = $(HOME)/.local/share/gnome-shell/extensions

all_sources = $(shell find src -type f)

typescript_sources = $(shell find src -type f -name '*.ts' -not -name '*.d.ts')
typescript_compiled = $(typescript_sources:src/%.ts=.build/%.js)

translations_ts_sources = src/indicator.ts src/prefs.ts
translations_ui_sources = $(wildcard src/resources/ui/*.ui)
translations = $(wildcard po/*.po)

schema = src/schemas/org.gnome.shell.extensions.runcat.gschema.xml
stylesheet = src/stylesheet.css

build: dist/$(DIST_ARCHIVE)

dist:
	mkdir -p dist/

.build/%.js: $(typescript_sources)
	npm run build

dist/$(DIST_ARCHIVE): dist compile po/messages.pot $(translations) $(all_sources) $(typescript_compiled)
	gnome-extensions pack --force \
		$(addprefix --extra-source=, $(wildcard .build/*.js)) \
		$(addprefix --extra-source=, $(shell find .build/ -mindepth 1 -type d)) \
		--extra-source=./$(stylesheet) \
		--extra-source=./src/metadata.json \
		--extra-source=./src/resources \
		--extra-source=./LICENSE \
		--podir=./po \
		--schema=./$(schema) \
		-o dist/


po/%.po: po/messages.pot
	touch $@ && msgmerge --update $@ $^

po/messages.pot: $(translations_ts_sources) $(translations_ui_sources)
	xgettext \
		--language=JavaScript \
		--package-name=gnome-runcat-extension \
		--package-version=$$(jq .version src/metadata.json) \
		--from-code=UTF-8 \
		--output=$@ \
		$(translations_ts_sources)
	xgettext \
		--join-existing \
		--package-name=gnome-runcat-extension \
		--package-version=$$(jq .version src/metadata.json) \
		--from-code=UTF-8 \
		--output=$@ \
		$(translations_ui_sources)

translations: po/messages.pot $(translations)

compile: $(typescript_compiled)

clean:
	rm -rf dist .build

install: uninstall build
	gnome-extensions install dist/$(DIST_ARCHIVE) --force
	gnome-extensions enable $(UUID) || true
	@echo "You need to restart GNOME Shell to apply changes"

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
