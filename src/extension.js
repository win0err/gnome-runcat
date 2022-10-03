'use strict';

const Main = imports.ui.main;
const ExtensionUtils = imports.misc.extensionUtils;
const Extension = ExtensionUtils.getCurrentExtension();

const { PanelMenuButton } = Extension.imports.panelMenuButton;

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
    ExtensionUtils.initTranslations(Extension.metadata.uuid);

    return new RunCatExtension();
}