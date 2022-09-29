/* eslint-disable no-var, no-unused-vars */

var SCHEMA_PATH = 'org.gnome.shell.extensions.runcat';
var LOG_ERROR_PREFIX = 'RuncatExtensionError';

const RUNNER_AND_PERCENTAGE = 0;
const PERCENTAGE_ONLY = 1;
const RUNNER_ONLY = 2;

var DisplayingItems = {
    RUNNER_AND_PERCENTAGE: 'Runner and percentage',
    PERCENTAGE_ONLY: 'Percentage only',
    RUNNER_ONLY: 'Runner only',
};

var PanelMenuButtonVisibility = {
    [RUNNER_AND_PERCENTAGE]: { runner: true, percentage: true },
    [PERCENTAGE_ONLY]: { runner: false, percentage: true },
    [RUNNER_ONLY]: { runner: true, percentage: false },
};

var Settings = {
    SLEEPING_THRESHOLD: 'sleeping-threshold',
    DISPLAYING_ITEMS: 'displaying-items',
};