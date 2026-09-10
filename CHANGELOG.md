# Changelog

## 0.3.0 - 2026-09-10

- Migrate the repository scripts from `.mjs` to TypeScript and run them with Node's native type stripping.
- Raise `engines.node` to `>=22.18.0`, the first release that runs TypeScript sources without a flag.
- Move the build to Vite 8 and `vite-plugin-turbowarp-extension` 0.3.0; the tracked extension bundle is regenerated.
- Keep the WebUSB PaSoRi runtime API, Extension ID, opcodes, reader ownership, and IDm wait semantics unchanged.
- Roll back by pinning `@kubohiroya/turbowarp-webusb-pasori@0.2.0`.

## 0.2.0 - 2026-08-25

- Replace the repository license file with the full MPL-2.0 text.
- Align package metadata, README guidance, Pages content, repository policy, and release checks.
- Keep the WebUSB PaSoRi runtime API, Extension ID, opcodes, reader ownership, and IDm wait semantics unchanged.

Rollback: pin `@kubohiroya/turbowarp-webusb-pasori@0.1.0`.

