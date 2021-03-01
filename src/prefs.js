const { GObject, Gtk } = imports.gi;
const Extension = imports.misc.extensionUtils.getCurrentExtension();

const { Settings } = Extension.imports.settings;

const RuncatSettingsWidget = GObject.registerClass(
    { GTypeName: 'RuncatSettingsWidget' },
    class RuncatSettingsWidget extends Gtk.Box {
        _init() {
            super._init({
                orientation: Gtk.Orientation.VERTICAL,
                border_width: 20,
                spacing: 20,
            });

            this._settings = new Settings();

            this._initSleepingThreshold();
            this._initShowComboBox();
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
                halign: Gtk.Align.END,
            });
            scale.set_size_request(400, 15);
            scale.set_value(this._settings.sleepingThreshold.get());

            this._settings.sleepingThreshold.addListener(() => {
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

        _initShowComboBox() {
            const hbox = new Gtk.Box({
                orientation: Gtk.Orientation.HORIZONTAL,
            });

            const label = new Gtk.Label({
                label: 'Show',
                use_markup: true,
            });

            const combo = new Gtk.ComboBoxText({
                halign: Gtk.Align.END,
                visible: true
            });

            const options = ['Runner and percentage', 'Percentage only', 'Runner only'];
            options.forEach(opt => combo.append(opt, opt));

            /*const actions = [
                function(settings) { // show runner & percentage
                    settings.hideRunner.set(false);
                    settings.hidePercentage.set(false);
                },
                function(settings) { // show percentage only
                    settings.hideRunner.set(true);
                    settings.hidePercentage.set(false);
                },
                function(settings) { // show runner only
                    settings.hideRunner.set(false);
                    settings.hidePercentage.set(true);
                },
            ];*/

            combo.set_active(this._getActiveShowIndex());

            this._settings.hideRunner.addListener(() => {
                combo.set_active(this._getActiveShowIndex());
            });
            this._settings.hidePercentage.addListener(() => {
                combo.set_active(this._getActiveShowIndex());
            });
            combo.connect('changed', (widget) => {
                switch (widget.get_active()) {
                    case 0: // show runner & percentage
                        this._settings.hideRunner.set(false);
                        this._settings.hidePercentage.set(false);
                        break;
                    case 1: // show percentage only
                        this._settings.hideRunner.set(true);
                        this._settings.hidePercentage.set(false);
                        break;
                    case 2: // show runner only
                        this._settings.hideRunner.set(false);
                        this._settings.hidePercentage.set(true);
                }
               //const action = actions[widget.get_active()];
                //if (action)
                    //action(this._settings);
            });

            this.connect('destroy', () => {
                this._settings.hideRunner.removeAllListeners();
                this._settings.hidePercentage.removeAllListeners();
            });

            hbox.add(label);
            hbox.pack_end(combo, false, false, 0);

            this.add(hbox);
        }

        _getActiveShowIndex() {
            const hideRunner = this._settings.hideRunner.get();
            const hidePercentage = this._settings.hidePercentage.get();

            if (!hideRunner && !hidePercentage)
                return 0;
            else if (hideRunner)
                return 1;
            else if (hidePercentage)
                return 2;

            return 0; // default
        }

        _initBottomButtons() {
            const resetButton = new Gtk.Button({ label: 'Reset to default' });

            resetButton.connect('clicked', () => {
                this._settings.sleepingThreshold.set(0);
                this._settings.hideRunner.set(false);
                this._settings.hidePercentage.set(false);
            });

            this.pack_end(resetButton, false, false, 0);
        }
    },
);

function buildPrefsWidget() {
    return new RuncatSettingsWidget();
}

function init() {
    // do nothing
}
