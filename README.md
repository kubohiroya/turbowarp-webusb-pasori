# TurboWarp-WebUSB-PaSoRi

[日本語](README.ja.md)

TurboWarp-WebUSB-PaSoRi is a TurboWarp capability extension for reading NFC card
IDm and PMm values from Sony PaSoRi readers through WebUSB.

**[Open the user guide](https://kubohiroya.github.io/turbowarp-webusb-pasori/)** ·
**[日本語ガイド](https://kubohiroya.github.io/turbowarp-webusb-pasori/ja/)**

## What it does

- Connects one or more Sony PaSoRi readers with project-local names such as `left` or `right`.
- Reads NFC card IDm and PMm values through WebUSB.
- Stores the latest IDm in Temporary Variables for TurboWarp projects.
- Exposes a runtime API for other unsandboxed extensions.

The extension intentionally stays scoped to PaSoRi card ID reading. It does not
provide general NFC, NDEF payload, or transit-card history access.

## Requirements and safety

- TurboWarp must load the extension without the sandbox.
- WebUSB requires a secure context such as HTTPS or localhost.
- The browser must support WebUSB and `navigator.usb.requestDevice`.
- Connecting a reader requires a user gesture and browser device permission.
- The project user chooses which physical PaSoRi is assigned to each reader name.
- Some operating systems, drivers, or browser protected-interface rules can block `claimInterface(0)`.
- Use only readers and cards you are authorized to access.

## Installation

For package-based tooling:

```bash
pnpm add --save-exact @kubohiroya/turbowarp-webusb-pasori@0.2.0
```

For direct TurboWarp loading:

```text
https://cdn.jsdelivr.net/npm/@kubohiroya/turbowarp-webusb-pasori@0.2.0/dist/webusb-pasori.js
```

## Quick start

1. Open TurboWarp in a WebUSB-capable desktop browser.
2. Enable unsandboxed custom extensions.
3. Load `dist/webusb-pasori.js` or the CDN URL above.
4. Run `connect PaSoRi as [READER_ID]` from a user action such as a clicked script.
5. Use `wait for NFC card on PaSoRi [READER_ID]...` to wait for an IDm.

## Block reference

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

`readerId` is a project-local logical name. The browser device picker decides
which physical PaSoRi is assigned to that logical name. `readCardInfo()` returns
`spec`, `idm`, and `pmm` when a supported tag is read.

## Compatibility

The generated bundle is a single, non-minified TurboWarp extension file with
Extension Gallery metadata and the standard `(function (Scratch) { ... })(Scratch);`
wrapper. Runtime API names, Extension ID, and opcodes are intentionally stable
for this release.

## Development

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm run check
```

### Build workflow

```text
TypeScript source
  -> Vite
  -> vite-plugin-turbowarp-extension
  -> dist/webusb-pasori.js

Extension config + block definitions
  -> extension manifest plugin
  -> dist/extension-manifest.json
```

For continuous rebuilding during development:

```bash
pnpm run dev
```

### Project structure

- `src/config.ts`: extension metadata
- `src/block-definitions.json`: canonical block metadata used by both the extension and README generator
- `src/extension.ts`: extension implementation
- `src/extension-manifest.ts`: canonical manifest generator and Vite output plugin
- `src/index.ts`: extension registration entry point
- `src/globals.d.ts`: Scratch API declarations used by the project
- `schemas/extension-manifest.schema.json`: JSON Schema for the generated API contract
- `scripts/generate-readme.ts`: updates the generated README block section
- `tests/`: unit tests
- `vite.config.ts`: TurboWarp-compatible Vite build configuration
- `dist/`: tracked TurboWarp JavaScript and extension API manifest

### Extension API manifest

Each build emits `dist/extension-manifest.json` with `formatVersion: 1`. It records the extension ID,
block opcodes and types, argument IDs and types, and menu references in a deterministic order. Tools
such as `sb3-toolchain` can compare this contract before updating an embedded extension or migrating
its ID. See [the architecture document](docs/architecture.md) and the
[JSON Schema](schemas/extension-manifest.schema.json) for the v1 contract.

After changing runtime or block metadata, regenerate and verify the tracked release artifacts:

```bash
pnpm run check:dist
```

### Generated documentation

Regenerate block documentation with:

```bash
pnpm run docs
```

`pnpm run check` also runs `docs:check`, which fails if `README.md` is out of date with `src/block-definitions.json`.

## Release

```bash
pnpm run check
pnpm run release:check
```

## License

SPDX-License-Identifier: MPL-2.0
