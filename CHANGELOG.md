# Changelog

## 0.6.1 - 2026-10-30

- NFCカードを大きくし、カード内のNFC表記を読みやすくしました。配布SVGと実行時アイコンに同じ図案を使います。
- 拡張ID・opcode・実行ロジック・依存は維持します。
- ロールバック: `@kubohiroya/turbowarp-webusb-pasori@0.6.0` へ固定して利用します。

## 0.6.0 - 2026-10-29

- 製作者情報を name: `Hiroya Kubo`、email: `hiroya@cuc.ac.jp`、url: `https://github.com/kubohiroya` のオブジェクトへ統一。
- ビルド依存 `@kubohiroya/turbowarp-extension-manifest` を `^0.4.0` から `^0.5.0` へ更新。
- ビルド依存 `@kubohiroya/vite-plugin-turbowarp-extension` を `^0.9.0` から `^0.10.0` へ更新。
- ロールバック: `@kubohiroya/turbowarp-webusb-pasori@0.5.1` を固定して利用する。

## 0.5.1 - 2026-10-28

- Pagesで動作するsamplesデモを追加しました。npm公開物のAPI・拡張ID・既定値は変わりません。

## 0.5.0 - 2026-10-27

- 共通manifest 0.4.0とvite-plugin-turbowarp-extension 0.9.0へ追従し、lockfileと公開版・利用例を更新します。
- WebUSB PaSoRiのruntime API、拡張ID、opcode、reader所有権とIDm待機の契約を維持します。
- 切り戻しは`@kubohiroya/turbowarp-webusb-pasori@0.4.0`への固定です。

## 0.4.0 - 2026-10-26

- 公開済みのvite-plugin-turbowarp-extension 0.8.0へ追従し、lockfileと配布bundleを更新します。
- npm/CDNの利用例とリリース差分の基点情報を更新します。
- WebUSB PaSoRiのruntime API、拡張ID、opcode、reader所有権とIDm待機の契約を維持します。
- 切り戻しは`@kubohiroya/turbowarp-webusb-pasori@0.3.1`への固定です。

## 0.3.1 - 2026-10-19

- Publish the selected Git source with explicit base revision metadata and exact latest internal npm dependencies.
- Preserve public APIs and block data contracts; prior release history is retained below.


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

