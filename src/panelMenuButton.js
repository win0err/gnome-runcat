const PanelMenu = imports.ui.panelMenu;
const { St, Clutter, GObject } = imports.gi;
const ExtensionUtils = imports.misc.extensionUtils;

const Extension = ExtensionUtils.getCurrentExtension();

const { Timer } = Extension.imports.timer;
const { Cpu } = Extension.imports.cpu;
const { IconProvider } = Extension.imports.iconProvider;


var PanelMenuButton = GObject.registerClass(
    class PanelMenuButton extends PanelMenu.Button {
        _init() {
            super._init(null, Extension.metadata.name);

            this.cpu = new Cpu();
            this.iconProvider = new IconProvider();

            this.ui = new Map();
            this.timers = new Map();

            this.currentSprite = 0;

            this._initUi();
            this._initTimers();
        }

        get animationInterval() {
            // y = 5000/sqrt(x+30) - 400
            return 5000 / Math.sqrt(this.cpu.utilization + 30) - 400;
        }

        _initUi() {
            const box = new St.BoxLayout({style_class: 'panel-status-menu-box'});

            this.ui.set('icon', new St.Icon({style_class: 'system-status-icon runcat-menu__icon', gicon: this.iconProvider.sleeping}));
            this.ui.set(
                'label',
                new St.Label({
                    style_class: 'runcat-menu__label',
                    y_expand: true,
                    y_align: Clutter.ActorAlign.CENTER,
                }),
            );

            this.ui.forEach(element => box.add_child(element));
            this.ui.set('box', box);

            this.add_child(box);
        }

        _initTimers() {
            this.timers.set('cpu', new Timer(() => this.cpu.refresh(), 3000));

            this.timers.set('ui', new Timer(() => {
                    if (this.timers.has('ui')) {
                        this.timers.get('ui').interval = this.animationInterval;
                    }

                    this.ui.get('icon').set_gicon(
                        this.cpu.utilization > 0 ? this.iconProvider.nextSprite : this.iconProvider.sleeping,
                    );

                    const utilization = Math.ceil(this.cpu.utilization || 0);
                    this.ui.get('label').set_text(`${utilization}%`);
                }, 250),
            );
        }

        destroy() {
            this.timers.forEach(timer => timer.stop());
            this.ui.forEach(element => element.destroy());

            super.destroy();
        }
    }
);