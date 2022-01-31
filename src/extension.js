'use strict';

const Main = imports.ui.main;
const Extension = imports.misc.extensionUtils.getCurrentExtension();

const { PanelMenuButton } = Extension.imports.panelMenuButton;

const onSessionModeUpdate = () => {
    // log(JSON.stringify(Main.sessionMode, null, 2));
    log(`Should tick: ${!Main.sessionMode.isLocked && !Main.sessionMode.isGreeter}`);
};

class RunCatExtension {
    constructor() {
        this.extensionButton = null;
    }

    enable() {
        this.extensionButton = new PanelMenuButton();
        Main.panel.addToStatusArea('RunCat', this.extensionButton);
    }

    disable() {
        this.extensionButton.destroy();
        this.extensionButton = null;
    }
}

function init() {
    Main.sessionMode.connect('updated', onSessionModeUpdate);
    onSessionModeUpdate();
    return new RunCatExtension();
}