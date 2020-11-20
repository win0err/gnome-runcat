module.exports = {
  environments: ['gjs'],
  modules: ['Gtk-3.0', 'Soup-2.4', 'St-1.0', 'Shell-0.1'],
  prettify: true,
  girDirectories: [
    '/usr/share/gir-1.0',
    '/usr/share/gnome-shell',
    '/usr/lib/mutter-7'
  ],
  outdir: './@types',
  ignore: []
}
