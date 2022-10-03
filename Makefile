#!/usr/bin/make -f

.PHONY : build clean install uninstall open-prefs spawn-gnome-shell translations
.DEFAULT_GOAL := build

UUID = runcat@kolesnikov.se
DIST_ARCHIVE = $(UUID).shell-extension.zip
LOCAL = $(HOME)/.local/share/gnome-shell/extensions

all_sources = $(shell find src -type f)

js_sources = $(shell cd src && find . -maxdepth 1 -type f -name '*.js')

translations_sources = src/panelMenuButton.js src/prefs.js
translations_sources += $(shell find src/resources/ui -maxdepth 1 -type f -name '*.ui')
translations = $(shell find src/po -maxdepth 1 -type f -name '*.po')


build: dist/$(DIST_ARCHIVE)

dist:
	mkdir -p dist/

dist/$(DIST_ARCHIVE): dist $(all_sources)
	gnome-extensions pack -f src/ \
		$(addprefix --extra-source=, $(js_sources)) \
		--extra-source=./dataProviders \
		--extra-source=./resources \
		--extra-source=../assets \
		--extra-source=../LICENSE \
		--podir=./po \
		-o dist/


src/po/%.po: src/po/messages.pot
	msgmerge --update $@ src/po/messages.pot

src/po/messages.pot: $(translations_sources)
	xgettext \
		--package-name gnome-runcat-extension \
		--package-version 20 \
		--from-code=UTF-8 \
		--output=src/po/messages.pot \
		$^

translations: src/po/messages.pot $(translations)

clean:
	rm -rf dist

install: uninstall build
	gnome-extensions install dist/$(DIST_ARCHIVE) --force
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
