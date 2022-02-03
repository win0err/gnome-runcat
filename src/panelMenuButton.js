const PanelMenu = imports.ui.panelMenu;
const ExtensionUtils = imports.misc.extensionUtils;
const Extension = ExtensionUtils.getCurrentExtension();
const { St, Clutter, GObject } = imports.gi;

const { Settings } = Extension.imports.settings;
const { Timer } = Extension.imports.timer;
const { Cpu } = Extension.imports.cpu;
const { IconProvider, getIconProvider } = Extension.imports.iconProvider;

// eslint-disable-next-line
var PanelMenuButton = GObject.registerClass(
    { GTypeName: 'PanelMenuButton' },
    class PanelMenuButton extends PanelMenu.Button {
        _init() {
            super._init(null, Extension.metadata.name);

            this.cpu = new Cpu();

            this.ui = new Map();
            this.timers = new Map();

            this.currentSprite = 0;

            this._initSettings();
            this._initUi();
            this._initListeners();
            this._initTimers();
        }

        get animationInterval() {
            const utilizationCoefficient = this.cpu.utilization > 100 ? 100 : this.cpu.utilization;

            // y = 5000/sqrt(x+30) - 400
            return Math.ceil((5000 / Math.sqrt(utilizationCoefficient + 30) / (this.iconProvider.speed || 1)) - 400);
        }

        _initSettings() {
            this.settings = new Settings();

            this.sleepingThreshold = this.settings.sleepingThreshold.get();
            this.isRunnerHidden = this.settings.hideRunner.get();
            this.isPercentageHidden = this.settings.hidePercentage.get();
            this.iconPack = this.settings.iconPack.get();
        }

        _initUi() {
            this.iconProvider = getIconProvider(this.iconPack);

            const box = new St.BoxLayout({
                style_class: 'panel-status-menu-box runcat-menu',
            });

            const icon = new St.Icon({
                style_class: 'system-status-icon runcat-menu__icon',
                gicon: this.iconProvider.sleeping,
            });
            this.ui.set('icon', icon);
            this._manageUiElementVisibility('icon', this.isRunnerHidden);

            const labelBox = new St.BoxLayout({});
            this.ui.set('labelBox', labelBox);

            const label = new St.Label({
                style_class: 'runcat-menu__label',
                y_expand: true,
                y_align: Clutter.ActorAlign.CENTER,
                x_align: Clutter.ActorAlign.FILL,
                x_expand: true,
            });
            this.ui.set('label', label);
            labelBox.add_child(label);
            this._manageUiElementVisibility('labelBox', this.isPercentageHidden);

            box.add_child(icon);
            box.add_child(labelBox);
            this.ui.set('box', box);

            this.add_child(box);
        }

        _manageUiElementVisibility(elementName, isHidden) {
            const action = isHidden ? 'hide' : 'show';
            this.ui.get(elementName)[action]();
        }

        _initListeners() {
            this.settings.hideRunner.addListener(() => {
                this.isRunnerHidden = this.settings.hideRunner.get();
                this._manageUiElementVisibility('icon', this.isRunnerHidden);
            });

            this.settings.hidePercentage.addListener(() => {
                this.isPercentageHidden = this.settings.hidePercentage.get();
                this._manageUiElementVisibility('labelBox', this.isPercentageHidden);
            });

            this.settings.sleepingThreshold.addListener(() => {
                this.sleepingThreshold = this.settings.sleepingThreshold.get();
            });

            this.settings.iconPack.addListener(() => {
                this.iconPack = this.settings.iconPack.get();
                this.iconProvider = getIconProvider(this.iconPack);
            });
        }

        _initTimers() {
            this.timers.set('cpu', new Timer(() => {
                try {
                    this.cpu.refresh();
                } catch (e) {
                    logError(e, 'RuncatExtensionError'); // eslint-disable-line no-undef
                }
            }, 3000));

            this.timers.set(
                'ui',
                new Timer(() => {
                    try {
                        if (this.timers.has('ui')) {
                            this.timers.get('ui').interval = this.animationInterval;
                        }

                        if (!this.isRunnerHidden) {
                            const isRunningSpriteShown = this.cpu.utilization > this.sleepingThreshold;
                            this.ui.get('icon').set_gicon(
                                isRunningSpriteShown ? this.iconProvider.nextSprite : this.iconProvider.sleeping,
                            );
                        }

                        if (!this.isPercentageHidden) {
                            const utilization = Math.ceil(this.cpu.utilization || 0);
                            this.ui.get('label').set_text(`${utilization}%`);
                        }
                    } catch (e) {
                        logError(e, 'RuncatExtensionError'); // eslint-disable-line no-undef
                    }
                }, 250),
            );
        }

        destroy() {
            this.timers.forEach(timer => timer.stop());
            this.ui.forEach(element => element.destroy());

            this.settings.hideRunner.removeAllListeners();
            this.settings.hidePercentage.removeAllListeners();
            this.settings.sleepingThreshold.removeAllListeners();
            this.settings.iconPack.removeAllListeners();

            super.destroy();
        }
    },
);