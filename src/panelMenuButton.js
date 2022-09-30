const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const { trySpawnCommandLine } = imports.misc.util;

const ExtensionUtils = imports.misc.extensionUtils;
const Extension = ExtensionUtils.getCurrentExtension();
const {
    Gio,
    GObject,
    Gtk,
    GLib,
} = imports.gi;

const {
    SYSTEM_MONITOR_COMMAND,
    SCHEMA_PATH,
    PanelMenuButtonVisibility,
    Settings,
} = Extension.imports.constants;
const { createGenerator: createCpuGenerator } = Extension.imports.dataProviders.cpu;

const getGIcon = name => Gio.icon_new_for_string(
    `${Extension.path}/resources/icons/cat/my-${name}-symbolic.svg`,
);

// eslint-disable-next-line func-names
const spritesGenerator = function* () {
    const SPRITES_COUNT = 5;

    const sprites = [...Array(SPRITES_COUNT).keys()]
        .map(i => getGIcon(`running-${i}`));

    let i;
    while (true) {
        for (i = 0; i < SPRITES_COUNT; i++) {
            yield sprites[i];
        }
    }
};

// y = 5000/sqrt(x+30) - 400
const getAnimationInterval = cpuUtilization => Math.ceil(5000 / Math.sqrt(cpuUtilization + 30) - 400);

// eslint-disable-next-line
var PanelMenuButton = GObject.registerClass(
    { GTypeName: 'PanelMenuButton' },
    class PanelMenuButton extends PanelMenu.Button {
        _init() {
            super._init(null, Extension.metadata.name);

            this.dataProviders = {
                cpu: createCpuGenerator(),
            };

            this.initSettingsListeners();
            this.initUi();
            this.initSources();
        }

        initUi() {
            this.ui = {
                builder: Gtk.Builder.new(),
                icons: {
                    sleeping: getGIcon('sleeping'),
                    runningGenerator: spritesGenerator(),
                },
            };

            const itemsVisibility = PanelMenuButtonVisibility[this.settings.displayingItems];

            this.ui.builder.add_from_file(`${Extension.path}/resources/ui/extension.ui`);

            const icon = this.ui.builder.get_object('icon');
            icon.set_property('gicon', this.ui.icons.sleeping);
            if (!itemsVisibility.runner) {
                icon.hide();
            }

            const labelBox = this.ui.builder.get_object('labelBox');
            labelBox.add_child(this.ui.builder.get_object('label'));
            if (!itemsVisibility.percentage) {
                labelBox.hide();
            }

            const box = this.ui.builder.get_object('box');
            box.add_child(icon);
            box.add_child(labelBox);

            this.add_child(box);

            this.menu.addAction(
                'Open System Monitor',
                () => trySpawnCommandLine(SYSTEM_MONITOR_COMMAND),
            );
            this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
            this.menu.addAction('Settings', () => ExtensionUtils.openPrefs());
        }

        destroyUi() {
            this.ui.builder.get_object('icon').destroy();
            this.ui.builder.get_object('label').destroy();
            this.ui.builder.get_object('labelBox').destroy();
            this.ui.builder.get_object('box').destroy();
        }

        updateItemsVisibility() {
            const itemsVisibility = PanelMenuButtonVisibility[this.settings.displayingItems];

            const runnerAction = itemsVisibility.runner ? 'show' : 'hide';
            const percentageAction = itemsVisibility.percentage ? 'show' : 'hide';

            this.ui.builder.get_object('icon')[runnerAction]();
            this.ui.builder.get_object('labelBox')[percentageAction]();
        }

        initSettingsListeners() {
            this.gioSettings = ExtensionUtils.getSettings(SCHEMA_PATH);
            this.settings = {
                sleepingThreshold: this.gioSettings.get_int(Settings.SLEEPING_THRESHOLD),
                displayingItems: this.gioSettings.get_enum(Settings.DISPLAYING_ITEMS),
            };

            this.gioSettings.connect(`changed::${Settings.SLEEPING_THRESHOLD}`, () => {
                this.settings.sleepingThreshold = this.gioSettings.get_int(Settings.SLEEPING_THRESHOLD);
            });

            this.gioSettings.connect(`changed::${Settings.DISPLAYING_ITEMS}`, () => {
                this.settings.displayingItems = this.gioSettings.get_enum(Settings.DISPLAYING_ITEMS);

                const itemsVisibility = PanelMenuButtonVisibility[this.settings.displayingItems];

                const runnerAction = itemsVisibility.runner ? 'show' : 'hide';
                const percentageAction = itemsVisibility.percentage ? 'show' : 'hide';

                this.ui.builder.get_object('icon')[runnerAction]();
                this.ui.builder.get_object('labelBox')[percentageAction]();
            });
        }

        async initSources() {
            this.refreshDataSourceId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 3000, () => this.refreshData());
            await this.refreshData();

            this.repaintUiSourceId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 0, () => this.repaintUi());
        }

        destroySources() {
            GLib.source_remove(this.refreshDataSourceId);
            GLib.source_remove(this.repaintUiSourceId);
        }

        async refreshData() {
            const { value: cpu } = await this.dataProviders.cpu.next();
            this.data = { cpu };

            return GLib.SOURCE_CONTINUE;
        }

        repaintUi() {
            const isRunningSpriteShown = this.data?.cpu > this.settings.sleepingThreshold;
            const gicon = isRunningSpriteShown ? this.ui.icons.runningGenerator.next().value : this.ui.icons.sleeping;

            this.ui.builder.get_object('icon').set_gicon(gicon);
            this.ui.builder.get_object('label').set_text(`${Math.round(this.data.cpu)}%`);

            const animationInterval = getAnimationInterval(this.data.cpu);

            this.repaintUiSourceId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, animationInterval, () => this.repaintUi());

            return GLib.SOURCE_REMOVE;
        }

        destroy() {
            this.destroySources();
            this.destroyUi();

            super.destroy();
        }
    },
);