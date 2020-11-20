const Gtk = imports.gi.Gtk;

const Extension = imports.misc.extensionUtils.getCurrentExtension();
const Settings = Extension.imports.settings;

let sleepingThresholdSlider = null;

function init() { }

function buildPrefsWidget() {
    const config = new Settings.Prefs();

    const frame = new Gtk.Box({
        orientation: Gtk.Orientation.VERTICAL,
        border_width: 20,
        spacing: 20
    });

    sleepingThresholdSlider = addSlider(frame, "Sleeping Threshold", config.SLEEPINGTHRESHOLD, 0, 99, 0);

    addDefaultButton(frame, config);

    frame.show_all();

    return frame;
}

function addDefaultButton(frame, config) {
    const button = new Gtk.Button({label: "Reset to default"});
    button.connect('clicked', function () {
        config.SLEEPINGTHRESHOLD.set(0);
        sleepingThresholdSlider.set_value(config.SLEEPINGTHRESHOLD.get());
    });

    frame.pack_end(button, false, false, 0);

    return button;
}

function addSlider(frame, labelText, prefConfig, lower, upper, decimalDigits) {
    const scale = new Gtk.HScale({
        digits: decimalDigits,
        adjustment: new Gtk.Adjustment({lower: lower, upper: upper}),
        value_pos: Gtk.PositionType.RIGHT,
        hexpand: true,
        halign: Gtk.Align.END
    });
    scale.set_value(prefConfig.get());
    scale.connect('value-changed', function (sw) {
        const newval = sw.get_value();
        if (newval !== prefConfig.get()) {
            prefConfig.set(newval);
        }
    });
    scale.set_size_request(400, 15);

    const hbox = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL, spacing: 20});
    hbox.add(new Gtk.Label({label: labelText, use_markup: true}));
    hbox.add(scale);

    frame.add(hbox);

    return scale;
}
