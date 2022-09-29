const {
    Adw,
    Gio,
    Gdk,
    Gtk,
} = imports.gi;

const ExtensionUtils = imports.misc.extensionUtils;
const Extension = ExtensionUtils.getCurrentExtension();

const { SCHEMA_PATH, Settings } = Extension.imports.constants;

// modified version of desktop cube's helper
// https://github.com/Schneegans/Desktop-Cube/blob/main/prefs.js#L238
const findWidgetByType = (parent, type) => {
    // eslint-disable-next-line no-restricted-syntax
    for (const child of parent) {
        if (child instanceof type) return child;

        const match = findWidgetByType(child, type);
        if (match) return match;
    }

    return null;
};

// eslint-disable-next-line no-unused-vars
function fillPreferencesWindow(window) {
    const settings = ExtensionUtils.getSettings(SCHEMA_PATH);

    const builder = Gtk.Builder.new();
    builder.add_from_file(`${Extension.path}/resources/ui/preferences.ui`);

    settings.bind(
        Settings.SLEEPING_THRESHOLD,
        builder.get_object(Settings.SLEEPING_THRESHOLD),
        'value',
        Gio.SettingsBindFlags.DEFAULT,
    );

    const combo = builder.get_object(Settings.DISPLAYING_ITEMS);
    combo.set_selected(settings.get_enum(Settings.DISPLAYING_ITEMS));
    combo.connect('notify::selected', widget => {
        settings.set_enum(Settings.DISPLAYING_ITEMS, widget.selected);
    });

    builder.get_object('reset').connect('clicked', () => {
        settings.reset(Settings.SLEEPING_THRESHOLD);

        settings.reset(Settings.DISPLAYING_ITEMS);
        combo.set_selected(settings.get_enum(Settings.DISPLAYING_ITEMS));
    });

    const page = builder.get_object('preferences-general');
    window.add(page);

    // eslint-disable-next-line no-param-reassign
    window.title = `${Extension.metadata.name} Preferences`;

    const homepageAction = Gio.SimpleAction.new('homepage', null);
    homepageAction.connect('activate', () => Gtk.show_uri(null, Extension.metadata.url, Gdk.CURRENT_TIME));

    const aboutAction = Gio.SimpleAction.new('about', null);
    aboutAction.connect('activate', () => {
        const logo = Gtk.Image.new_from_file(`${Extension.path}/resources/se.kolesnikov.runcat.svg`);

        const aboutDialog = builder.get_object('about-dialog');
        aboutDialog.set_property('logo', logo.get_paintable());
        aboutDialog.set_property('version', `Version ${Extension.metadata.version}`);
        aboutDialog.set_property('transient_for', window);

        aboutDialog.present();
    });

    const group = Gio.SimpleActionGroup.new();
    group.add_action(homepageAction);
    group.add_action(aboutAction);

    const menu = builder.get_object('menu-button');
    menu.insert_action_group('prefs', group);

    const header = findWidgetByType(window.get_content(), Adw.HeaderBar);
    header.pack_end(menu);
}

function init() {
    // do nothing
}