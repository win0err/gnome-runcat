const { Gio } = imports.gi;
const ExtensionUtils = imports.misc.extensionUtils;

const Extension = ExtensionUtils.getCurrentExtension();

const getGIcon = (name, pack = 'cat', ext = 'svg') => Gio.icon_new_for_string(
    `${Extension.path}/icons/${pack}/my-${name}-symbolic.${ext}`,
);

// eslint-disable-next-line
var IconProvider = class IconProvider {
    constructor(pack, ext, spritesCount = 5) {
        this.spritesCount = spritesCount;
        this.currentSprite = 0;

        this._sleeping = getGIcon('sleeping', pack, ext);

        this.sprites = [...Array(spritesCount).keys()]
            .map(i => getGIcon(`running-${i}`, pack, ext));
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
    }};