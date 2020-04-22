'use strict';

const Main = imports.ui.main;
const { St, Clutter, Gio } = imports.gi;
const ExtensionUtils = imports.misc.extensionUtils;
const Extension = ExtensionUtils.getCurrentExtension();

const { Timer } = Extension.imports.timer;
const { Cpu } = Extension.imports.cpu;

// y = 5000/sqrt(x+30) - 400
const getIntervalByUtilization = utilization => 5000/Math.sqrt(utilization + 30) - 400;

const SPRITES_COUNT = 5;

let cpu;
let animationTimer, cpuRefreshTimer;
let extensionButton, frequencyLabel, catIcon;
let currentSprite = 0;

function init() {
    log(`initializing ${Extension.metadata.name} version ${Extension.metadata.version}`);
}

function enable() {
    log(`enabling ${Extension.metadata.name} version ${Extension.metadata.version}`);

    extensionButton = new St.Bin({ style_class: 'panel-status-button' });
    
    cpu = new Cpu();
    cpuRefreshTimer = new Timer(() => cpu.refresh(), 3000);

    catIcon = new St.Icon({
        gicon: Gio.icon_new_for_string(`${Extension.path}/assets/cat/sleeping.svg`),
        icon_size: 26,
    });

    frequencyLabel =  new St.Label({
        style_class: 'frequency-label',
        y_expand: true,
        y_align: Clutter.ActorAlign.CENTER,
    });

    animationTimer  = new Timer(() => {
        if (animationTimer) {
            animationTimer.interval = getIntervalByUtilization(cpu.utilization);
        }

        if (cpu.utilization > 0) {
            currentSprite = currentSprite === SPRITES_COUNT - 1 ? 0 : currentSprite + 1;
            catIcon.gicon = Gio.icon_new_for_string(`${Extension.path}/assets/cat/running/${currentSprite}.svg`);
        } else {
            currentSprite = 0;
            catIcon.gicon = Gio.icon_new_for_string(`${Extension.path}/assets/cat/sleeping.svg`);
        }

        const utilization = Math.ceil(cpu.utilization || 0);
        frequencyLabel.set_text(`${utilization}%`);
    }, 250);

    const box = new St.BoxLayout();
    box.add(catIcon);
    box.add(frequencyLabel);

    extensionButton.set_child(box);

    Main.panel._rightBox.insert_child_at_index(extensionButton, 0);
}

function disable() {
    log(`disabling ${Extension.metadata.name} version ${Extension.metadata.version}`);

    if(animationTimer) {
        animationTimer.stop();
    }

    if(cpuRefreshTimer) {
        cpuRefreshTimer.stop();
    }

    Main.panel._rightBox.remove_child(extensionButton);
}