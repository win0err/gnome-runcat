// eslint-disable-next-line no-unused-vars, no-var
var readFile = gioFile => new Promise((resolve, reject) => {
    gioFile.load_contents_async(
        null,
        (f, result) => {
            try {
                const contents = f.load_contents_finish(result)[1];
                const decodedContents = new TextDecoder('utf-8').decode(contents);

                resolve(decodedContents);
            } catch (e) {
                reject(e);
            }
        },
    );
});

// modified version of desktop cube's helper
// https://github.com/Schneegans/Desktop-Cube/blob/main/prefs.js#L238
// eslint-disable-next-line no-unused-vars, no-var
var findWidgetByType = (parent, type) => {
    // eslint-disable-next-line no-restricted-syntax
    for (const child of parent) {
        if (child instanceof type) return child;

        const match = findWidgetByType(child, type);
        if (match) return match;
    }

    return null;
};