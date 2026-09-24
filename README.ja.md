# TurboWarp-WebUSB-PaSoRi

[English](README.md)

TurboWarp-WebUSB-PaSoRiは、Sony PaSoRiリーダーからWebUSB経由でNFCカードのIDm/PMmを読み取るTurboWarp capability extensionです。

**[English guide](https://kubohiroya.github.io/turbowarp-webusb-pasori/)** ·
**[日本語ガイド](https://kubohiroya.github.io/turbowarp-webusb-pasori/ja/)**

## できること

- 複数のSony PaSoRiリーダーを`left`や`right`などの作品内reader名で接続する。
- WebUSB経由でNFCカードのIDm/PMmを読む。
- 読み取ったIDmをTurboWarpのTemporary Variablesへ保存する。
- 他のunsandboxed拡張向けにruntime APIを公開する。

この拡張はPaSoRiのカードID読み取りに範囲を絞っています。汎用NFC、NDEF本文、交通系IC履歴の読み取りは扱いません。

## 要件と安全上の注意

- TurboWarpで「Run extension without sandbox」を使う必要があります。
- WebUSBにはHTTPSまたはlocalhostなどの安全なコンテキストが必要です。
- ブラウザがWebUSBと`navigator.usb.requestDevice`に対応している必要があります。
- reader接続にはユーザー操作とブラウザのdevice permissionが必要です。
- どの物理PaSoRiをどのreader名へ割り当てるかは、利用者がデバイス選択で決めます。
- OSドライバやブラウザの保護インターフェイス制限により、環境によっては`claimInterface(0)`が失敗します。
- 利用権限のあるreaderとカードだけを使ってください。

## インストール

package-based toolingで使う場合:

```bash
pnpm add --save-exact @kubohiroya/turbowarp-webusb-pasori@0.3.0
```

TurboWarpへ直接読み込む場合:

```text
https://cdn.jsdelivr.net/npm/@kubohiroya/turbowarp-webusb-pasori@0.3.0/dist/webusb-pasori.js
```

## Quick start

1. WebUSB対応のデスクトップブラウザでTurboWarpを開く。
2. unsandboxed custom extensionを有効にする。
3. `dist/webusb-pasori.js`または上記CDN URLを読み込む。
4. クリックなどのユーザー操作から`connect PaSoRi as [READER_ID]`を実行する。
5. `wait for NFC card on PaSoRi [READER_ID]...`でIDmを待つ。

## ブロック

- `connect PaSoRi as [READER_ID]`: WebUSBのデバイス選択を表示し、PaSoRiを作品内reader名で接続します。
- `wait for NFC card on PaSoRi [READER_ID] set runtime var [RUNTIME_VAR] to IDm`: 指定readerでカードが読めるまで待ち、IDmをruntime variableに保存します。
- `wait for NFC card on PaSoRi [READER_ID] set runtime var [RUNTIME_VAR] to IDm and broadcast [MESSAGE]`: 保存後にbroadcastを開始します。
- `last NFC IDm on PaSoRi [READER_ID]`: 指定readerで最後に読み取ったIDmを返します。
- `connected PaSoRi count`: 接続済みPaSoRi数を返します。

runtime variableを書き込むブロックにはTemporary Variables (`lmsTempVars2`) が必要です。

## Runtime API

他のunsandboxed拡張は`Scratch.vm.runtime.ext_kubohiroyawebusbpasori`を参照できます。

```js
const left = await pasori.connectPasori({readerId: 'left'});
const right = await pasori.connectPasori({readerId: 'right'});
const card = await left.readCardInfo();
const leftIdm = await pasori.waitForNfcIdm({readerId: 'left', signal});
const rightIdm = await pasori.waitForNfcIdm({readerId: 'right', signal});
```

`readerId`は`left`や`right`のような作品内の論理名です。WebUSBのデバイス選択で、どの物理PaSoRiをその名前に割り当てるかを選びます。`card`には`spec`、`idm`、`pmm`が含まれます。

## Compatibility

生成bundleは、Extension Gallery metadataと標準の`(function (Scratch) { ... })(Scratch);` wrapperを持つ、単一の非minify TurboWarp extension fileです。このreleaseではruntime API名、Extension ID、opcodeを変更しません。

## 開発

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm run check
```

GitHub Pages用の静的サイトは`docs/`にあり、英語版は`docs/index.html`、日本語版は`docs/ja/index.html`です。block referenceは`src/block-definitions.json`から生成し、手書き変更しません。

## Release

```bash
pnpm install
pnpm run check
pnpm run release:check
```

## ライセンス

SPDX-License-Identifier: MPL-2.0
