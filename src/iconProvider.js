const { Gio } = imports.gi;
const ExtensionUtils = imports.misc.extensionUtils;

const Extension = ExtensionUtils.getCurrentExtension();


class IconProvider {
    constructor(spritesCount = 5) {
        this.spritesCount = spritesCount;
        this.currentSprite = 0;

        this._sleeping = Gio.icon_new_for_string(`${Extension.path}/assets/cat/sleeping.svg`);

        this.sprites = [...Array(spritesCount).keys()]
            .map(i => Gio.icon_new_for_string(`${Extension.path}/assets/cat/running/${i}.svg`));
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
}
