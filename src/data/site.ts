// Hand-kept: bump VERSION and RELEASE_LINE after each Crook release. A build-time fetch of the
// latest release would make every image build depend on GitHub answering, for one line of copy.
export const VERSION = "v0.1.35";
export const RELEASE_LINE =
  "answer Claude Code from a card, 2×2 splits, Settings and Plugins from the keyboard, and long agent panes in a seventh of the memory";
export const REPO_URL = "https://github.com/theguriev/crook";
export const RELEASES_URL = "https://github.com/theguriev/crook/releases";
export const ARCHITECTURE_URL = "https://github.com/theguriev/crook/blob/main/docs/architecture.md";
export const REGISTRY_URL = "https://github.com/theguriev/crook-plugins";
export const TEMPLATE_URL = "https://github.com/theguriev/crook-plugin-template";
export const API_CRATE_URL = "https://crates.io/crates/crook_plugin_api";
export const INSTALL_COMMAND =
  "curl -fsSL https://raw.githubusercontent.com/theguriev/crook/main/script/install | sh";
/** The same, and the desktop entry, icons and AppStream record that put Crook in a Linux application menu. */
export const INSTALL_DESKTOP_COMMAND = `${INSTALL_COMMAND} -s -- --desktop`;
/** The release's own assets, named after the version above. */
export const DMG_URL = `${RELEASES_URL}/download/${VERSION}/crook-${VERSION}-macos.dmg`;
export const WINDOWS_ZIP_URL = `${RELEASES_URL}/download/${VERSION}/crook-${VERSION}-x86_64-pc-windows-msvc.zip`;
