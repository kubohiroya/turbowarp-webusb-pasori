# TurboWarp-WebUSB-PaSoRi

[English](README.md)

TurboWarp-WebUSB-PaSoRiは、Sony PaSoRiリーダーからWebUSB経由でNFCカードのIDm/PMmを読み取るTurboWarp拡張capabilityです。複数のPaSoRiを作品内のreader名で接続できるため、どのPaSoRiにどのNFCタグがかざされたかを検出できます。汎用NFCやNDEFではなく、PaSoRiのカードID読み取りに絞って開始します。

**[English guide](https://kubohiroya.github.io/turbowarp-webusb-pasori/)** ·
**[日本語ガイド](https://kubohiroya.github.io/turbowarp-webusb-pasori/ja/)**

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
