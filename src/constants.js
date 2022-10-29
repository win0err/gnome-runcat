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

const CAT = 0;
const METRONOME = 1;

var RunnerPack = {
    [CAT]: 'cat',
    [METRONOME]: 'metronome',
};

var Settings = {
    IDLE_THRESHOLD: 'idle-threshold',
    ANIMATED_IDLE: 'animated-idle',
    DISPLAYING_ITEMS: 'displaying-items',
    RUNNER_PACK: 'runner-pack',
};

var RunnerStates = {
    IDLE: 'idle',
    ACTIVE: 'active',
};

var SYSTEM_MONITOR_COMMAND = 'gnome-system-monitor -r';