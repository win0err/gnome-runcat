/* eslint-disable no-var, no-unused-vars */

var SCHEMA_PATH = 'org.gnome.shell.extensions.runcat';
var LOG_ERROR_PREFIX = 'RuncatExtensionError';

const CHARACTER_AND_PERCENTAGE = 0;
const PERCENTAGE_ONLY = 1;
const CHARACTER_ONLY = 2;

var PanelMenuButtonVisibility = {
    [CHARACTER_AND_PERCENTAGE]: { character: true, percentage: true },
    [PERCENTAGE_ONLY]: { character: false, percentage: true },
    [CHARACTER_ONLY]: { character: true, percentage: false },
};

var Settings = {
    IDLE_THRESHOLD: 'idle-threshold',
    IDLE_ANIMATION: 'idle-animation',
    DISPLAYING_ITEMS: 'displaying-items',
};

var SYSTEM_MONITOR_COMMAND = 'gnome-system-monitor -r';