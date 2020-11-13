const Gtk = imports.gi.Gtk;

let Extension = imports.misc.extensionUtils.getCurrentExtension();
let Settings = Extension.imports.settings;

let catSleepingSlider = null;

function init() { }

function buildPrefsWidget() {
    let config = new Settings.Prefs();

    let frame = new Gtk.Box({
        orientation: Gtk.Orientation.VERTICAL,
        border_width: 20,
        spacing: 20
    });

    catSleepingSlider = addSlider(frame, "Cat sleep before", config.CATSLEEPING, 0, 99, 0);

    addDefaultButton(frame, config);

    frame.show_all();

    return frame;
}

function addDefaultButton(frame, config) {
    let button = new Gtk.Button({label: "Reset to default"});
    button.connect('clicked', function () {
        config.CATSLEEPING.set(0);
        catSleepingSlider.set_value(config.CATSLEEPING.get());
    });

    frame.pack_end(button, false, false, 0);

    return button;
}

function addSlider(frame, labelText, prefConfig, lower, upper, decimalDigits) {
    let scale = new Gtk.HScale({
        digits: decimalDigits,
        adjustment: new Gtk.Adjustment({lower: lower, upper: upper}),
        value_pos: Gtk.PositionType.RIGHT,
        hexpand: true,
        halign: Gtk.Align.END
    });
    scale.set_value(prefConfig.get());
    scale.connect('value-changed', function (sw) {
        var newval = sw.get_value();
        if (newval !== prefConfig.get()) {
            prefConfig.set(newval);
        }
    });
    scale.set_size_request(400, 15);

    let hbox = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL, spacing: 20});
    hbox.add(new Gtk.Label({label: labelText, use_markup: true}));
    hbox.add(scale);

    frame.add(hbox);

    return scale;
}
