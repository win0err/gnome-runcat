const { Gio } = imports.gi;
const ExtensionUtils = imports.misc.extensionUtils;

const Extension = ExtensionUtils.getCurrentExtension();

const getGIcon = (name, pack = 'cat', ext = 'svg') => Gio.icon_new_for_string(
    `${Extension.path}/icons/${pack}/my-${name}-symbolic.${ext}`,
);

// eslint-disable-next-line
var IconProvider = class IconProvider {
    constructor(pack, ext, spritesCount, speed) {
        this.spritesCount = spritesCount;
        this.speed = speed;
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
    }
};

// eslint-disable-next-line
var getIconProvider = (iconPack) => {
    const iconPacks = {
        cat: new IconProvider('cat', 'svg', 5, 1),
        'dancing-parrot': new IconProvider('dancing-parrot', 'png', 10, 1.5),
        chicken: new IconProvider('chicken', 'gif', 12, 1.5),
    };

    return iconPacks[iconPack] || iconPack.cat;
};