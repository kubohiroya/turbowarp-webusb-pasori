# 最小デモ: read-one-nfc-idm

[Editor](https://turbowarp.org/editor?project_url=https%3A%2F%2Fkubohiroya.github.io%2Fturbowarp-webusb-pasori%2Fsamples%2Fread-one-nfc-idm.sb3) · [SB3](https://kubohiroya.github.io/turbowarp-webusb-pasori/samples/read-one-nfc-idm.sb3)

WebUSB対応HTTPSブラウザでConnectを明示クリックし、自分のPaSoRiを選びます。次にReadをクリックして自分のカードをかざすとIDmを表示します。Cで画面とruntime変数を消去できます。配布SB3の初期IDmは空です。

要件: WebUSB対応HTTPSブラウザ・Sony PaSoRi・対応する利用者自身のカード / 明示クリック/USB機器選択・OSドライバー・claimInterface権限 / 公式Temporary Variablesを依存URLで記録 / 既存ブロックにabort/releaseがないためUSB待機終了/解放はタブを閉じる。Stopだけで完全解放とは表現しない。

未検証: PaSoRi実機接続/USB許可/driver互換・実カードIDm読取 / USB待機と実機解放。自動検証でUSB chooserやカード読取を開始しない。 既存ブロックにはUSB切断・待機abortがなく停止だけでは解放できません。必ずタブを閉じて終了してください。Cは表示とruntime変数だけを消し、extension内部lastIdmは再読込まで残ります。実カード読取後のプロジェクトを保存/exportせず、空の生成SB3を配布してください。USB選択の取消/拒否ではクリックしたスクリプトが止まる場合があり、接続数とブラウザ/Scratch consoleを確認します。

## 編集・生成・公開

`read-one-nfc-idm/project.json`とSVGを編集しNode.js 26で生成します。

```sh
node scripts/build-samples.mjs
node scripts/build-samples.mjs --check
node --test scripts/verify-samples.mjs
node scripts/prepare-pages.mjs
```

unsandboxed用JSはSB3へ同梱し、Editorの通常の許可画面を使います。依存がある場合は全ID/URLを記録し、同梱JSはlicense/revision/SHA256を保持します。自動確認は音声・実機・点滅を開始せず初期状態/安全なcancel分岐だけを検証します。未検証を成功と表現しません。

切戻し: サンプル・README・Pages追加をrevert。本体と既定フラグは変更しません。
