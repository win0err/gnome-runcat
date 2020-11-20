const { GObject, Gtk } = imports.gi;
const Extension = imports.misc.extensionUtils.getCurrentExtension();

const { Settings } = Extension.imports.settings;

const RuncatSettingsWidget = GObject.registerClass(
    class RuncatSettingsWidget extends Gtk.Box {
        _init() {
            super._init({
                orientation: Gtk.Orientation.VERTICAL,
                border_width: 20,
                spacing: 20
            });

            this._settings = new Settings();

            this._initSleepingThreshold();
            this._initBottomButtons();

            this.show_all();
        }

        _initSleepingThreshold() {
            const hbox = new Gtk.Box({
                orientation: Gtk.Orientation.HORIZONTAL,
                spacing: 20,
            });

            const label = new Gtk.Label({
                label: 'Sleeping Threshold',
                use_markup: true,
            });

            const scale = new Gtk.HScale({
                digits: 0,
                adjustment: new Gtk.Adjustment({
                    lower: 0,
                    upper: 100,
                }),
                value_pos: Gtk.PositionType.RIGHT,
                hexpand: true,
                halign: Gtk.Align.END
            });
            scale.set_size_request(400, 15);
            scale.set_value(this._settings.sleepingThreshold.get());

            this._settings.sleepingThreshold.addListener (() => {
                const updatedValue = this._settings.sleepingThreshold.get();
                if (updatedValue !== scale.get_value()) {
                    scale.set_value(updatedValue);
                }
            });
            scale.connect('value-changed', () => {
                const updatedValue = scale.get_value();
                if (updatedValue !== this._settings.sleepingThreshold.get()) {
                    this._settings.sleepingThreshold.set(scale.get_value());
                }
            });
            this.connect('destroy', () => this._settings.sleepingThreshold.removeAllListeners());

            hbox.add(label);
            hbox.add(scale);

            this.add(hbox);
        }

        _initBottomButtons() {
            const resetButton = new Gtk.Button({
                label: 'Reset to default',
            });

            resetButton.connect('clicked', () => {
                this._settings.sleepingThreshold.set(0);
            });

            this.pack_end(resetButton, false, false, 0);
        }
    }
);

function buildPrefsWidget() {
    return new RuncatSettingsWidget();
}

function init() {
    // do nothing
}
