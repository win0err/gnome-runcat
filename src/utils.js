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