# Shared libmedia playback engine

The authoritative playback implementation for Vega Cast and Vega Desktop.
This package contains no React, Vidstack, pairing, signaling, providers or app UI.
Hosts attach a div, supply source descriptors, and subscribe to playback state.

```ts
import {LibmediaEngine} from '@vega/libmedia-engine';
const engine = new LibmediaEngine();
engine.attach(container);
engine.setEventListeners({onStateChange: updateExistingControls});
await engine.load({id:'media',source:url,format:'mkv'});
// On disposal:
await engine.destroy();
```

URLs and headers must be accessible to the host. Native networking belongs in
the app adapter; this package does not bypass browser security or run FFmpeg.
Volumes use 0–1; media positions and subtitle delays use seconds. Track IDs are
libmedia IDs, not array indices. Diagnostics report only exposed library data.

Import `copyLibmediaAssets` and `libmediaChunkPlugin` from
`@vega/libmedia-engine/assets` in build tooling. Copy assets to the host's public
directory before building, exclude `@libmedia/avplayer` from Vite prebundling,
and use the plugin for development lazy chunks. The asset tooling applies the
version-checked libmedia 1.3.1 subtitle selection, seek and MKV LanguageIETF fixes.
Both hosts use the same patches. Upgrading libmedia requires reviewing them.

WASM assets currently use the existing pinned libmedia 1.3.1 CDN URL. A host can
supply `new LibmediaEngine({wasmBaseUrl})` for its own decoder distribution.
Bundling all decoders for offline operation is not part of this extraction.

## GitHub distribution

The source lives at https://github.com/vega-org/vega-libmedia-engine.
This package is private to prevent accidental npm publication; GitHub installs
still work. Both consumers pin the same full Git commit, not a moving branch.

After committing and pushing an engine update, run in each consumer:

```sh
npm install --ignore-scripts --save-exact @vega/libmedia-engine@git+https://github.com/vega-org/vega-libmedia-engine.git#<full-commit-sha>
```

For Vega Site, add `--workspace @vega/web-cast` to that command.
Commit each consumer's manifest and lockfile, run its checks, and rebuild.
No sibling checkout, vendored archive or npm registry publication is required.
Each app bundles the engine and runs independently after installation.

Run `npm ci --ignore-scripts` and `npm test` here to check the engine contract.
Real browser/media tests remain in the consuming apps because they exercise
host integration and browser codec capabilities.
