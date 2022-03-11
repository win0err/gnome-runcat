/* eslint-disable max-classes-per-file */
const { Gio } = imports.gi;
const GioSSS = Gio.SettingsSchemaSource;
const ExtensionUtils = imports.misc.extensionUtils;
const Extension = ExtensionUtils.getCurrentExtension();

const SCHEMA_PATH = 'org.gnome.shell.extensions.runcat';

const valueTypes = {
    INTEGER: 'int',
    BOOLEAN: 'boolean',
    STRING: 'string',
    DOUBLE: 'double',
};

// eslint-disable-next-line
var Settings = class Settings {
    constructor(schemaPath = SCHEMA_PATH) {
        const schemaDir = Extension.dir.get_child('schemas');

        let schemaSource = GioSSS.get_default();
        if (schemaDir.query_exists(null)) {
            schemaSource = GioSSS.new_from_directory(
                schemaDir.get_path(),
                schemaSource,
                false,
            );
        }

        const schemaObj = schemaSource.lookup(schemaPath, true);
        if (!schemaObj) {
            throw new Error(`Schema ${schemaPath} could not be found for extension ${Extension.metadata.uuid}`);
        }

        this._gioSettings = new Gio.Settings({ settings_schema: schemaObj });
    }

    get sleepingThreshold() {
        if (!this._sleepingThreshold) {
            // eslint-disable-next-line no-use-before-define
            this._sleepingThreshold = new Value(
                this._gioSettings,
                'sleeping-threshold',
                valueTypes.INTEGER,
            );
        }

        return this._sleepingThreshold;
    }

    get hideRunner() {
        if (!this._hideRunner) {
            // eslint-disable-next-line no-use-before-define
            this._hideRunner = new Value(
                this._gioSettings,
                'hide-runner',
                valueTypes.BOOLEAN,
            );
        }

        return this._hideRunner;
    }

    get hidePercentage() {
        if (!this._hidePercentage) {
            // eslint-disable-next-line no-use-before-define
            this._hidePercentage = new Value(
                this._gioSettings,
                'hide-percentage',
                valueTypes.BOOLEAN,
            );
        }

        return this._hidePercentage;
    }

    get commandOnClick() {
        if (!this._commandOnClick) {
            // eslint-disable-next-line no-use-before-define
            this._commandOnClick = new Value(
                this._gioSettings,
                'command-on-click',
                valueTypes.STRING,
            );
        }

        return this._commandOnClick;
    }
};

class Value {
    constructor(gioSettings, key, type) {
        this._gioSettings = gioSettings;
        this._key = key;
        this._type = type;
        this._connectedCallbacks = [];
    }

    set(v) {
        return this._gioSettings[`set_${this._type}`](this._key, v);
    }

    get() {
        return this._gioSettings[`get_${this._type}`](this._key);
    }

    addListener(fn) {
        const id = this._gioSettings.connect(`changed::${this._key}`, fn);
        this._connectedCallbacks = [...this._connectedCallbacks, id];
        return id;
    }

    removeListener(id) {
        this._gioSettings.disconnect(id);
        this._connectedCallbacks = this._connectedCallbacks.filter(item => item !== id);
    }

    removeAllListeners() {
        this._connectedCallbacks.forEach(id => this._gioSettings.disconnect(id));
        this._connectedCallbacks = [];
    }
}