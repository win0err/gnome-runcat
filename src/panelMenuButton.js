const PanelMenu = imports.ui.panelMenu;
const ExtensionUtils = imports.misc.extensionUtils;
const Extension = ExtensionUtils.getCurrentExtension();
const { St, Clutter, GObject } = imports.gi;

const { Settings } = Extension.imports.settings;
const { Timer } = Extension.imports.timer;
const { Cpu } = Extension.imports.cpu;
const { IconProvider } = Extension.imports.iconProvider;

// eslint-disable-next-line
var PanelMenuButton = GObject.registerClass(
    { GTypeName: 'PanelMenuButton' },
    class PanelMenuButton extends PanelMenu.Button {
        _init() {
            super._init(null, Extension.metadata.name);

            this.cpu = new Cpu();
            this.iconProvider = new IconProvider();

            this.ui = new Map();
            this.timers = new Map();

            this.currentSprite = 0;

            this._initSettings();
            this._initUi();
            this._initListeners();
            this._initTimers();
        }

        get animationInterval() {
            // y = 5000/sqrt(x+30) - 400
            return 5000 / Math.sqrt(this.cpu.utilization + 30) - 400;
        }

        _initSettings() {
            this.settings = new Settings();

            this.sleepingThreshold = this.settings.sleepingThreshold.get();
            this.isRunnerHidden = this.settings.hideRunner.get();
            this.isPercentageHidden = this.settings.hidePercentage.get();
        }

        _initUi() {
            const box = new St.BoxLayout({ style_class: 'panel-status-menu-box' });

            this.ui.set(
                'icon',
                new St.Icon({
                    style_class: 'system-status-icon runcat-menu__icon',
                    gicon: this.iconProvider.sleeping,
                }),
            );
            this._manageUiElementVisibility('icon', this.isRunnerHidden);

            this.ui.set(
                'label',
                new St.Label({
                    style_class: 'runcat-menu__label',
                    y_expand: true,
                    y_align: Clutter.ActorAlign.CENTER,
                }),
            );
            this._manageUiElementVisibility('label', this.isPercentageHidden);

            this.ui.forEach(element => box.add_child(element));
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
                this._manageUiElementVisibility('label', this.isPercentageHidden);
            });

            this.settings.sleepingThreshold.addListener(() => {
                this.sleepingThreshold = this.settings.sleepingThreshold.get();
            });
        }

        _initTimers() {
            this.timers.set('cpu', new Timer(() => this.cpu.refresh(), 3000));

            this.timers.set(
                'ui',
                new Timer(() => {
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
                }, 250),
            );
        }

        destroy() {
            this.timers.forEach(timer => timer.stop());
            this.ui.forEach(element => element.destroy());

            this.settings.hideRunner.removeAllListeners();
            this.settings.hidePercentage.removeAllListeners();
            this.settings.sleepingThreshold.removeAllListeners();

            super.destroy();
        }
    },
);