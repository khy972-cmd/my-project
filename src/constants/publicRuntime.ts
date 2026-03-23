// Public runtime entry points that are referenced by source code, rewrites,
// and committed static assets. Keep these values stable unless the matching
// `public/` files and deployment rewrites move together.

export const HOME_IFRAME_PUBLIC_ROOT = "home-v2/main-v2-app";
export const HOME_IFRAME_PUBLIC_ENTRY = `${HOME_IFRAME_PUBLIC_ROOT}/index.html`;

// The current in-app "cert" action uses the React ConfirmSheetApp, but this
// standalone page still exists as a direct public compatibility entry.
export const LEGACY_CONFIRM_PUBLIC_ENTRY = "@confirm3.html";
export const LEGACY_CONFIRM_VENDOR_DIR = "vendor";
