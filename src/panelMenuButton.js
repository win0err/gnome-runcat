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

const _ = imports.gettext.domain(Extension.metadata.uuid).gettext;

const {
    SYSTEM_MONITOR_COMMAND,
    SCHEMA_PATH,
    PanelMenuButtonVisibility,
    RunnerPack,
    Settings,
    RunnerStates,
} = Extension.imports.constants;
const { createGenerator: createCpuGenerator } = Extension.imports.dataProviders.cpu;

const queryGIconExists = (name, state, index) => Gio.file_new_for_path(
    `${Extension.path}/resources/icons/${name}/my-${state}-${index}-symbolic.svg`,
).query_exists(null);

const getGIcon = (name, state, index) => Gio.icon_new_for_string(
    `${Extension.path}/resources/icons/${name}/my-${state}-${index}-symbolic.svg`,
);

const getGIconSet = (name, state) => {
    let count = 0;
    const SET = [];
    while (queryGIconExists(name, state, count)) {
        SET[count] = getGIcon(name, state, count);
        count++;
    }
    return SET;
};

// eslint-disable-next-line func-names
const spritesGenerator = function* (name, state) {
    const SET = getGIconSet(name, state);
    const LENGTH = SET.length;

    let i;
    while (true) {
        for (i = 0; i < LENGTH; i++) {
            yield SET[i];
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
                icons: this.loadUiIcons(),
            };
            this.ui.builder.set_translation_domain(Extension.metadata.uuid);

            const itemsVisibility = PanelMenuButtonVisibility[this.settings.displayingItems];

            this.ui.builder.add_from_file(`${Extension.path}/resources/ui/extension.ui`);

            const icon = this.ui.builder.get_object('icon');
            icon.set_property('gicon', this.ui.icons.idleGenerator.next().value);
            if (!itemsVisibility.character) {
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
                _('Open System Monitor'),
                () => trySpawnCommandLine(SYSTEM_MONITOR_COMMAND),
            );
            this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
            this.menu.addAction(_('Settings'), () => ExtensionUtils.openPrefs());
        }

        destroyUi() {
            this.ui.builder.get_object('icon').destroy();
            this.ui.builder.get_object('label').destroy();
            this.ui.builder.get_object('labelBox').destroy();
            this.ui.builder.get_object('box').destroy();
        }

        updateItemsVisibility() {
            const itemsVisibility = PanelMenuButtonVisibility[this.settings.displayingItems];

            const characterAction = itemsVisibility.character ? 'show' : 'hide';
            const percentageAction = itemsVisibility.percentage ? 'show' : 'hide';

            this.ui.builder.get_object('icon')[characterAction]();
            this.ui.builder.get_object('labelBox')[percentageAction]();
        }

        loadUiIcons() {
            const runnerPack = RunnerPack[this.settings.runnerPack];

            return {
                idle: getGIcon(runnerPack, RunnerStates.IDLE, 0),
                idleGenerator: spritesGenerator(runnerPack, RunnerStates.IDLE),
                runningGenerator: spritesGenerator(runnerPack, RunnerStates.ACTIVE),
            };
        }

        initSettingsListeners() {
            this.gioSettings = ExtensionUtils.getSettings(SCHEMA_PATH);
            this.settings = {
                idleThreshold: this.gioSettings.get_int(Settings.IDLE_THRESHOLD),
                idleAnimation: this.gioSettings.get_boolean(Settings.IDLE_ANIMATION),
                displayingItems: this.gioSettings.get_enum(Settings.DISPLAYING_ITEMS),
                runnerPack: this.gioSettings.get_enum(Settings.RUNNER_PACK),
            };

            this.gioSettings.connect(`changed::${Settings.IDLE_THRESHOLD}`, () => {
                this.settings.idleThreshold = this.gioSettings.get_int(Settings.IDLE_THRESHOLD);
            });

            this.gioSettings.connect(`changed::${Settings.IDLE_ANIMATION}`, () => {
                this.settings.idleAnimation = this.gioSettings.get_boolean(Settings.IDLE_ANIMATION);
            });

            this.gioSettings.connect(`changed::${Settings.DISPLAYING_ITEMS}`, () => {
                this.settings.displayingItems = this.gioSettings.get_enum(Settings.DISPLAYING_ITEMS);

                const itemsVisibility = PanelMenuButtonVisibility[this.settings.displayingItems];

                const characterAction = itemsVisibility.character ? 'show' : 'hide';
                const percentageAction = itemsVisibility.percentage ? 'show' : 'hide';

                this.ui.builder.get_object('icon')[characterAction]();
                this.ui.builder.get_object('labelBox')[percentageAction]();
            });

            this.gioSettings.connect(`changed::${Settings.RUNNER_PACK}`, () => {
                this.settings.runnerPack = this.gioSettings.get_enum(Settings.RUNNER_PACK);
                this.ui.icons = this.loadUiIcons();
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
            const isRunningSpriteShown = this.data?.cpu > this.settings.idleThreshold;
            const idleSprite = this.settings.idleAnimation
                ? this.ui.icons.idleGenerator.next().value
                : this.ui.icons.idle;
            const gicon = isRunningSpriteShown
                ? this.ui.icons.runningGenerator.next().value
                : idleSprite;

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