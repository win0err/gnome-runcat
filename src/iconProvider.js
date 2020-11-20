const { Gio } = imports.gi;
const ExtensionUtils = imports.misc.extensionUtils;

const Extension = ExtensionUtils.getCurrentExtension();

const getGIcon = (name, pack = 'cat') => Gio.icon_new_for_string(
    `${Extension.path}/icons/${pack}/my-${name}-symbolic.svg`,
);

// eslint-disable-next-line
var IconProvider = class IconProvider {
    constructor(spritesCount = 5) {
        this.spritesCount = spritesCount;
        this.currentSprite = 0;

        this._sleeping = getGIcon('sleeping');

        this.sprites = [...Array(spritesCount).keys()]
            .map(i => getGIcon(`running-${i}`));
    }

    get sleeping() {
        this.reset();

        return this._sleeping;
    }

    get nextSprite() {
        this.currentSprite++;

        if (this.currentSprite === this.spritesCount) {
            this.reset();
        }

        return this.sprites[this.currentSprite];
    }

    reset() {
        this.currentSprite = 0;
    }
};