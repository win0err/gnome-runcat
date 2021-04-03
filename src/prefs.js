const { GObject, Gtk } = imports.gi;
const Extension = imports.misc.extensionUtils.getCurrentExtension();

const Config = imports.misc.config;
const [major] = Config.PACKAGE_VERSION.split('.');
const shellVersion = Number.parseInt(major);

const isGtk4 = shellVersion >= 40;

const { Settings } = Extension.imports.settings;

const BaseComponent = isGtk4 ? Gtk.ScrolledWindow : Gtk.Box;


const RuncatSettingsWidget = GObject.registerClass(
    { GTypeName: 'RuncatSettingsWidget' },
    class RuncatSettingsWidget extends BaseComponent {
        _init() {
            if (isGtk4) {
                super._init({
                    hscrollbar_policy: Gtk.PolicyType.NEVER,
                });
            } else {
                super._init({
                    orientation: Gtk.Orientation.VERTICAL,
                    border_width: 20,
                    spacing: 20,
                });
            }

            this._settings = new Settings();
            if (isGtk4) {
                this._box = new Gtk.Box({
                    orientation: Gtk.Orientation.VERTICAL,
                    halign: Gtk.Align.CENTER,
                    spacing: 20,
                    margin_top: 20,
                    margin_bottom: 20,
                    margin_start: 20,
                    margin_end: 20,
                });

                this.set_child(this._box);
            }

            this._initSleepingThreshold();
            this._initShowComboBox();
            this._initBottomButtons();

            if (!isGtk4) {
                this.show_all();
            }
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

            const scaleConfig = {
                digits: 0,
                adjustment: new Gtk.Adjustment({
                    lower: 0,
                    upper: 100,
                }),
                hexpand: true,
                halign: Gtk.Align.END,
            };

            let scale;
            if (isGtk4) {
                scale = new Gtk.Scale({
                    ...scaleConfig,
                    draw_value: true,
                });
            } else {
                scale = new Gtk.HScale({
                    ...scaleConfig,
                    value_pos: Gtk.PositionType.RIGHT,
                });
            }
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

            if (isGtk4) {
                hbox.append(label);
                hbox.append(scale);

                this._box.append(hbox);
            } else {
                hbox.add(label);
                hbox.add(scale);

                this.add(hbox);
            }
        }

        _initShowComboBox() {
            const hbox = new Gtk.Box({
                orientation: Gtk.Orientation.HORIZONTAL,
            });

            const label = new Gtk.Label({
                label: 'Show',
                use_markup: true,
                margin_end: 20,
            });

            const combo = new Gtk.ComboBoxText({
                halign: Gtk.Align.END,
                visible: true
            });

            const options = ['Runner and percentage', 'Percentage only', 'Runner only'];
            options.forEach(opt => combo.append(opt, opt));

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
            });

            this.connect('destroy', () => {
                this._settings.hideRunner.removeAllListeners();
                this._settings.hidePercentage.removeAllListeners();
            });

            if (isGtk4) {
                hbox.append(label);
                hbox.append(combo);

                this._box.append(hbox);
            } else {
                hbox.add(label);
                hbox.pack_end(combo, false, false, 0);

                this.add(hbox);
            }
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

            return 0; // default show both
        }

        _initBottomButtons() {
            const resetButton = new Gtk.Button({ label: 'Reset to default' });

            resetButton.connect('clicked', () => {
                this._settings.sleepingThreshold.set(0);
                this._settings.hideRunner.set(false);
                this._settings.hidePercentage.set(false);
            });

            if (isGtk4) {
                this._box.append(resetButton);
            } else {
                this.pack_end(resetButton, false, false, 0);
            }
        }
    },
);

function buildPrefsWidget() {
    return new RuncatSettingsWidget();
}

function init() {
    // do nothing
}
