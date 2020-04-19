const Main = imports.ui.main;
const St = imports.gi.St;
const ExtensionUtils = imports.misc.extensionUtils;
const Extension = ExtensionUtils.getCurrentExtension();

const { Timer } = Extension.imports.timer;
const { Cpu } = Extension.imports.cpu;

// y = 5000/sqrt(x+30)- 400
const getIntervalByUtilization = utilization => 5000/Math.sqrt(utilization + 30) - 400;

const SPRITES_COUNT = 5;

let cpu;
let animationTimer, freqLabelTimer, cpuRefreshTimer;
let extensionButton, frequencyLabel, catIcon;
let currentSprite = 0;

function init() {
    // do nothing
}

function enable() {
    extensionButton = new St.Bin({ style_class: 'panel-status-button' });
    

    cpu = new Cpu();
    cpuRefreshTimer = new Timer(() => cpu.refresh(), 250); 


    catIcon = new St.Bin({ style_class: 'system-status-icon running-cat' });
    animationTimer  = new Timer(() => {
        if (animationTimer) {
            animationTimer.interval = getIntervalByUtilization(cpu.utilization);
        }

        catIcon.set_style(`background-image: url("${Extension.path}/assets/cat/${currentSprite}.png");`);
        currentSprite++;
        
        if (currentSprite > SPRITES_COUNT - 1) {
            currentSprite = 0;
        }
    }, 250);

    frequencyLabel = new St.Label({ style_class: 'frequency-label', text: "--" });
    freqLabelTimer  = new Timer(() => frequencyLabel.set_text(Math.ceil(cpu.utilization) + '%'), 1000);
    
    const box = new St.BoxLayout();
    box.add(catIcon);
    box.add(frequencyLabel);

    extensionButton.set_child(box);

    Main.panel._rightBox.insert_child_at_index(extensionButton, 0);
}

function disable() {
    if(animationTimer) {
        animationTimer.stop();
    }

    if(freqLabelTimer) {
        freqLabelTimer.stop();
    }

    if(cpuRefreshTimer) {
        cpuRefreshTimer.stop();
    }

    Main.panel._rightBox.remove_child(extensionButton);
}