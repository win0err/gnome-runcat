'use strict';

imports.gi.versions.Gtk = '4.0';

const Main = imports.ui.main;
const Extension = imports.misc.extensionUtils.getCurrentExtension();

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
    return new RunCatExtension();
}