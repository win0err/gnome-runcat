const { Gio } = imports.gi;
const ExtensionUtils = imports.misc.extensionUtils;

const Extension = ExtensionUtils.getCurrentExtension();

const queryGIconExists = (name, pack = 'cat') => Gio.file_new_for_path(
    `${Extension.path}/icons/${pack}/my-${name}-symbolic.svg`,
).query_exists(null);

const getGIcon = (name, pack = 'cat') => Gio.icon_new_for_string(
    `${Extension.path}/icons/${pack}/my-${name}-symbolic.svg`,
);

const getGIconSet = name => {
    let count = 0;
    const set = [];
    while (queryGIconExists(`${name}-${count}`)) {
        set[count] = getGIcon(`${name}-${count}`);
        count++;
    }
    return set;
};

const states = {
    SLEEPING: 0,
    RUNNING: 1,
};

// eslint-disable-next-line
var IconProvider = class IconProvider {
    constructor() {
        // Get sleeping sprites
        this.sleepingSprites = getGIconSet('sleeping');
        this.sleepingSpritesCount = this.sleepingSprites.length;

        // Get running sprites
        this.runningSprites = getGIconSet('running');
        this.runningSpritesCount = this.runningSprites.length;

        // Defaults
        this.spritesCount = this.sleepingSpritesCount;
        this.currentSprite = 0;
        this.state = states.SLEEPING;
    }

    set animationState(state) {
        if (state !== this.state) {
            this.reset();
            this.state = state;
            switch (state) {
            case states.SLEEPING: this.spritesCount = this.sleepingSpritesCount;
                break;
            case states.RUNNING: this.spritesCount = this.runningSpritesCount;
                break;
            default: throw new Error('iconProvider.animationState invalid state', state);
            }
        }
    }

    get nextSprite() {
        this.currentSprite++;

        if (this.currentSprite === this.spritesCount) {
            this.reset();
        }

        switch (this.state) {
        case states.SLEEPING:
            return this.sleepingSprites[this.currentSprite];
        case states.RUNNING:
            return this.runningSprites[this.currentSprite];
        default: throw new Error('iconProvider.nextSprite invalid state', this.state);
        }
    }

    reset() {
        this.currentSprite = 0;
    }
};