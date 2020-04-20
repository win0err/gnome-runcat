# RunCat for GNOME Shell

**RunCat** provides a key-frame animation to the GNOME Shell top bar.
Animation speed changes depending on the CPU usage.

![RunCat for GNOME Shell](assets/runcat-header.gif)

## Installation

This is the recommended method for installation, as it doesn't require the build dependencies for installation. You can install this extension by visiting [the GNOME Shell Extensions page](https://extensions.gnome.org/extension/2986/runcat/) for this extension.

### Manual installation from source code
If you want to install the extension from sources, clone [the RunCat repository](https://github.com/win0err/gnome-runcat), navigate to cloned directory and run:
```bash
$ make build
$ make install
```

After installation:
1. Restart the GNOME Shell: <kbd>ALT</kbd>+<kbd>F2</kbd> to open the command prompt, and enter <kbd>r</kbd> to restart the GNOME Shell;
2. Enable the extension: Open GNOME Tweaks → Extensions → RunCat → On.



## macOS version
Thanks to [Takuto Nakamura](https://github.com/Kyome22/menubar_runcat) for [the macOS version](https://kyome.io/runcat/index.html) and cats images.

---
_Developed by [Sergei Kolesnikov](https://github.com/win0err)_