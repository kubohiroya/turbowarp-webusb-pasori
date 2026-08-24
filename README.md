# WebUSB PaSoRi

[日本語](README.ja.md)

WebUSB PaSoRi is a TurboWarp extension capability for reading NFC card IDm and
PMm values from Sony PaSoRi readers through WebUSB. Multiple readers can be
connected under project-local names, allowing a project to detect which PaSoRi
reader saw which NFC tag. It intentionally starts with the narrow PaSoRi card ID
use case rather than general NFC or NDEF access.

**[Open the user guide](https://kubohiroya.github.io/turbowarp-webusb-pasori/)** ·
**[日本語ガイド](https://kubohiroya.github.io/turbowarp-webusb-pasori/ja/)**

## Build workflow

```text
TypeScript source
  -> Vite
  -> vite-plugin-turbowarp-extension
  -> dist/<extension-name>.js

Extension config + block definitions
  -> extension manifest plugin
  -> dist/extension-manifest.json
```

The generated JavaScript is a single, non-minified TurboWarp extension file with Extension Gallery metadata and the standard `(function (Scratch) { ... })(Scratch);` wrapper.

## Blocks

<!-- BEGIN GENERATED BLOCKS -->

### `connect PaSoRi as [READER_ID]`

Requests permission and connects a Sony PaSoRi reader over WebUSB with a project-local reader name.

| Property | Value |
|---|---|
| Type | Command |
| Opcode | `connectPasoriBlock` |
| `READER_ID` | String, default: `default` |

### `wait for NFC card on PaSoRi [READER_ID] set runtime var [RUNTIME_VAR] to IDm`

Waits until a card is read on the named PaSoRi and stores its IDm in a runtime variable.

| Property | Value |
|---|---|
| Type | Command |
| Opcode | `waitForNfcIdmSetRuntimeVar` |
| `READER_ID` | String, default: `default` |
| `RUNTIME_VAR` | String, default: `nfcIdm` |

### `wait for NFC card on PaSoRi [READER_ID] set runtime var [RUNTIME_VAR] to IDm and broadcast [MESSAGE]`

Waits until a card is read on the named PaSoRi, stores its IDm, and broadcasts a message.

| Property | Value |
|---|---|
| Type | Command |
| Opcode | `waitForNfcIdmSetRuntimeVarAndBroadcast` |
| `READER_ID` | String, default: `default` |
| `RUNTIME_VAR` | String, default: `nfcIdm` |
| `MESSAGE` | String, default: `nfcScanned` |

### `last NFC IDm on PaSoRi [READER_ID]`

Returns the most recent NFC IDm read by the named PaSoRi.

| Property | Value |
|---|---|
| Type | Reporter |
| Opcode | `lastIdmReporter` |
| `READER_ID` | String, default: `default` |

### `connected PaSoRi count`

Returns the number of PaSoRi readers connected through this extension.

| Property | Value |
|---|---|
| Type | Reporter |
| Opcode | `connectedPasoriCount` |

<!-- END GENERATED BLOCKS -->

## Development

```bash
npm install
npm run check
```

## Runtime API

Other unsandboxed extensions can access `Scratch.vm.runtime.ext_kubohiroyawebusbpasori`.
Use `connectPasori({readerId})` to request and retain a PaSoRi device under a
project-local reader name, `waitForNfcIdm({readerId, signal})` to wait for a
card ID on a specific reader, or `PasoriDevice.readCardInfo()` for IDm/PMm
details.

```js
await pasori.connectPasori({readerId: 'left'});
await pasori.connectPasori({readerId: 'right'});
const leftIdm = await pasori.waitForNfcIdm({readerId: 'left', signal});
const rightIdm = await pasori.waitForNfcIdm({readerId: 'right', signal});
```

For continuous rebuilding during development:

```bash
npm run dev
```

## Project structure

- `src/config.ts`: extension metadata
- `src/block-definitions.json`: canonical block metadata used by both the extension and README generator
- `src/extension.ts`: extension implementation
- `src/extension-manifest.ts`: canonical manifest generator and Vite output plugin
- `src/index.ts`: extension registration entry point
- `src/globals.d.ts`: Scratch API declarations used by the project
- `schemas/extension-manifest.schema.json`: JSON Schema for the generated API contract
- `scripts/generate-readme.mjs`: updates the generated README block section
- `tests/`: unit tests
- `vite.config.ts`: TurboWarp-compatible Vite build configuration
- `dist/`: tracked TurboWarp JavaScript and extension API manifest

## Extension API manifest

Each build emits `dist/extension-manifest.json` with `formatVersion: 1`. It records the extension ID,
block opcodes and types, argument IDs and types, and menu references in a deterministic order. Tools
such as `sb3-toolchain` can compare this contract before updating an embedded extension or migrating
its ID. See [the architecture document](docs/architecture.md) and the
[JSON Schema](schemas/extension-manifest.schema.json) for the v1 contract.

After changing runtime or block metadata, regenerate and verify the tracked release artifacts:

```bash
npm run check:dist
```

## Generated documentation

Regenerate block documentation with:

```bash
npm run docs
```

`npm run check` also runs `docs:check`, which fails if `README.md` is out of date with `src/block-definitions.json`.

## License

MPL-2.0
