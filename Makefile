UUID = "runcat@kolesnikov.se"
LOCAL = $(HOME)/.local/share/gnome-shell/extensions

build: clean
	mkdir -p dist build
	cp -r src/* build/
	cp LICENSE build
	(cd build; zip -qr ../dist/$(UUID).zip .)

clean:
	rm -rf build
	rm -rf dist

install: build
	unzip dist/$(UUID) -d $(LOCAL)/$(UUID)
