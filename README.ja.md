# WebUSB PaSoRi

[English](README.md)

WebUSB PaSoRiは、Sony PaSoRiリーダーからWebUSB経由でNFCカードのIDm/PMmを読み取るTurboWarp拡張capabilityです。汎用NFCやNDEFではなく、PaSoRiのカードID読み取りに絞って開始します。

**[English guide](https://kubohiroya.github.io/turbowarp-webusb-pasori/)** ·
**[日本語ガイド](https://kubohiroya.github.io/turbowarp-webusb-pasori/ja/)**

## ブロック

- `connect PaSoRi`: WebUSBのデバイス選択を表示し、PaSoRiへ接続します。
- `wait for NFC card set runtime var [RUNTIME_VAR] to IDm`: カードが読めるまで待ち、IDmをruntime variableに保存します。
- `wait for NFC card set runtime var [RUNTIME_VAR] to IDm and broadcast [MESSAGE]`: 保存後にbroadcastを開始します。
- `last NFC IDm`: 最後に読み取ったIDmを返します。

runtime variableを書き込むブロックにはTemporary Variables (`lmsTempVars2`) が必要です。

## Runtime API

他のunsandboxed拡張は`Scratch.vm.runtime.ext_kubohiroyawebusbpasori`を参照できます。

```js
const device = await pasori.connectPasori();
const card = await device.readCardInfo();
const idm = await pasori.waitForNfcIdm({signal});
```

`card`には`spec`、`idm`、`pmm`が含まれます。

## 要件と制約

- TurboWarpの「Run extension without sandbox」
- WebUSB対応ブラウザ
- HTTPSまたはlocalhostなどの安全なコンテキスト
- Sony PaSoRiリーダー

OSドライバやブラウザの保護インターフェイス制限により、環境によっては`claimInterface(0)`が失敗します。この拡張はカードID読み取りに範囲を絞っており、NDEF本文や交通系IC履歴の読み取りは扱いません。

## 開発

```bash
pnpm install
pnpm check
```

GitHub Pages用の静的サイトは`docs/`にあり、英語版は`docs/index.html`、日本語版は`docs/ja/index.html`です。

## ライセンス

MPL-2.0
