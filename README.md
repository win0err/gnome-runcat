<img height="165" src="src/resources/se.kolesnikov.runcat.svg" alt="RunCat for GNOME Shell Logo" align="right" />

# RunCat for GNOME Shell

**RunCat** provides a key-frame animation to the GNOME Shell top bar. \
Animation speed changes depending on CPU usage.

<br />

![RunCat for GNOME Shell](assets/runcat-header.gif)

## Installation

This is the recommended method for installation, as it doesn't require the build dependencies for installation. You can install this extension by visiting [the GNOME Shell Extensions page](https://extensions.gnome.org/extension/2986/runcat/) for this extension.

[<img src="assets/get-it-on-ego.png" height="100">](https://extensions.gnome.org/extension/2986/runcat/)

### Manual installation

#### From source code
If you want to install the extension from sources, clone [the RunCat repository](https://github.com/win0err/gnome-runcat), navigate to the cloned directory and run:
```bash
$ make install
```

#### Release ZIP-archive
If you want to install the extension from release zip-archive,
download `runcat@kolesnikov.se.zip` from [the releases section](https://github.com/win0err/gnome-runcat/releases) and run:
```bash
$ gnome-extensions install path/to/runcat@kolesnikov.se.zip --force
```

#### After installation:
1. Restart the GNOME Shell:
    - <kbd>ALT</kbd>+<kbd>F2</kbd> to open the command prompt, and enter <kbd>r</kbd> to restart the GNOME Shell;
    - or Log Out, then Log In, if GNOME Shell won't restart;
2. Enable the extension:
    - Open GNOME Tweaks → Extensions → RunCat → On;
    - or Run in terminal: `gnome-extensions enable runcat@kolesnikov.se`.


### Manage RunCat preferences
- Open GNOME Tweaks → Extensions → RunCat → ⚙️;
- or Open [RunCat on GNOME Extensions portal](https://extensions.gnome.org/extension/2986/runcat/) → ⚙️;
- or Manage directly in `dconf`: `dconf list /org/gnome/shell/extensions/runcat/`.


## macOS version
Thanks to [Takuto Nakamura](https://github.com/Kyome22/menubar_runcat) for [the macOS version](https://kyome.io/runcat/index.html) and cat images.

---
_Developed by [Sergei Kolesnikov](https://github.com/win0err)_
