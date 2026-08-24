// Name: WebUSB PaSoRi
// ID: kubohiroyawebusbpasori
// Description: Read NFC card IDm and PMm values with Sony PaSoRi over WebUSB.
// By: Hiroya Kubo
// License: MPL-2.0

(function (Scratch) {
  'use strict';

  const extensionConfig = {
    id: "kubohiroyawebusbpasori",
    name: "WebUSB PaSoRi"
  };
  const extensionName = "WebUSB PaSoRi";
  const blocks = [{ "opcode": "connectPasoriBlock", "blockType": "COMMAND", "text": "connect PaSoRi", "description": "Requests permission and connects a Sony PaSoRi reader over WebUSB.", "arguments": {} }, { "opcode": "waitForNfcIdmSetRuntimeVar", "blockType": "COMMAND", "text": "wait for NFC card set runtime var [RUNTIME_VAR] to IDm", "description": "Waits until a card is read and stores its IDm in a runtime variable.", "arguments": { "RUNTIME_VAR": { "type": "STRING", "defaultValue": "nfcIdm" } } }, { "opcode": "waitForNfcIdmSetRuntimeVarAndBroadcast", "blockType": "COMMAND", "text": "wait for NFC card set runtime var [RUNTIME_VAR] to IDm and broadcast [MESSAGE]", "description": "Waits until a card is read, stores its IDm, and broadcasts a message.", "arguments": { "RUNTIME_VAR": { "type": "STRING", "defaultValue": "nfcIdm" }, "MESSAGE": { "type": "STRING", "defaultValue": "nfcScanned" } } }, { "opcode": "lastIdmReporter", "blockType": "REPORTER", "text": "last NFC IDm", "description": "Returns the most recent NFC IDm read by this extension.", "arguments": {} }];
  const definitions = {
    extensionName,
    blocks
  };
  const blockDefinitions = definitions.blocks;
  const sonyVendorId = 1356;
  const ack = Object.freeze([0, 0, 255, 0, 255, 0]);
  function hex(bytes) {
    return bytes.map((value) => value.toString(16).padStart(2, "0")).join("").toUpperCase();
  }
  function abortError() {
    const error = new Error("NFC reading was aborted.");
    error.name = "AbortError";
    return error;
  }
  function webUsb() {
    const usb = globalThis.navigator?.usb;
    if (!usb || typeof usb.requestDevice !== "function") {
      throw new Error("WebUSB PaSoRi requires navigator.usb.requestDevice.");
    }
    return usb;
  }
  class PasoriDevice {
    constructor(device) {
      this.device = device;
    }
    async release() {
      if (this.device.opened) await this.device.close();
    }
    async readCardInfo() {
      await this.send([...ack]);
      await this.sendCommand(42, [1]);
      const type2 = await this.getType2TagInfo();
      if (type2) return type2;
      return this.getType3TagInfo();
    }
    async readIDm() {
      return (await this.readCardInfo())?.idm ?? "";
    }
    async receive(length) {
      const data = await this.device.transferIn(1, length);
      const view = data.data;
      if (!view) return [];
      return Array.from({ length: view.byteLength }, (_unused, index) => view.getUint8(index));
    }
    async send(data) {
      await this.device.transferOut(2, new Uint8Array(data));
    }
    async sendCommand(commandCode, params) {
      const data = [214, commandCode, ...params];
      const command = [0, 0, 255, 255, 255, data.length, 0, 256 - data.length, ...data];
      const sum = data.reduce((total, value) => total + value, 0);
      command.push(256 - sum & 255, 0);
      await this.send(command);
      await this.receive(6);
      return this.receive(40);
    }
    async getType2TagInfo() {
      await this.sendCommand(6, [0]);
      await this.sendCommand(0, [2, 3, 15, 3]);
      await this.sendCommand(2, [
        0,
        24,
        1,
        1,
        2,
        1,
        3,
        0,
        4,
        0,
        5,
        0,
        6,
        0,
        7,
        8,
        8,
        0,
        9,
        0,
        10,
        0,
        11,
        0,
        12,
        0,
        14,
        4,
        15,
        0,
        16,
        0,
        17,
        0,
        18,
        0,
        19,
        6
      ]);
      await this.sendCommand(2, [1, 0, 2, 0, 5, 1, 0, 6, 7, 7]);
      await this.sendCommand(4, [54, 1, 38]);
      await this.sendCommand(2, [4, 1, 7, 8]);
      await this.sendCommand(2, [1, 0, 2, 0]);
      const response = await this.sendCommand(4, [54, 1, 147, 32]);
      const idm = hex(response.slice(15, 19));
      return idm === "00" || idm.length === 0 ? null : { spec: "Type2", idm, pmm: null };
    }
    async getType3TagInfo() {
      await this.sendCommand(42, [1]);
      await this.sendCommand(6, [0]);
      await this.sendCommand(0, [1, 1, 15, 1]);
      await this.sendCommand(2, [
        0,
        24,
        1,
        1,
        2,
        1,
        3,
        0,
        4,
        0,
        5,
        0,
        6,
        0,
        7,
        8,
        8,
        0,
        9,
        0,
        10,
        0,
        11,
        0,
        12,
        0,
        14,
        4,
        15,
        0,
        16,
        0,
        17,
        0,
        18,
        0,
        19,
        6
      ]);
      await this.sendCommand(2, [0, 24]);
      const data = await this.sendCommand(4, [110, 0, 6, 0, 255, 255, 1, 0]);
      const idm = hex(data.slice(17, 25));
      if (idm.length === 0) return null;
      return { spec: "Type3", idm, pmm: hex(data.slice(25, 33)) };
    }
  }
  class WebUsbPasoriExtension {
    constructor() {
      this.device = null;
      this.lastIdm = "";
      Scratch.vm.runtime.ext_kubohiroyawebusbpasori = this;
    }
    getInfo() {
      return {
        id: extensionConfig.id,
        name: Scratch.translate(definitions.extensionName),
        blocks: blockDefinitions.map((block) => this.toScratchBlock(block))
      };
    }
    lastIdmReporter() {
      return this.lastIdm;
    }
    async connectPasoriBlock() {
      await this.connectPasori();
    }
    async waitForNfcIdmSetRuntimeVar(args) {
      const idm = await this.waitForNfcIdm();
      this.writeRuntimeVariable(args.RUNTIME_VAR, idm);
    }
    async waitForNfcIdmSetRuntimeVarAndBroadcast(args) {
      const idm = await this.waitForNfcIdm();
      this.writeRuntimeVariable(args.RUNTIME_VAR, idm);
      const message = String(args.MESSAGE ?? "").trim();
      if (!message) throw new Error("MESSAGE must be specified.");
      this.runtime().startHats?.("event_whenbroadcastreceived", { BROADCAST_OPTION: message });
    }
    async connectPasori() {
      if (this.device) return this.device;
      const device = await webUsb().requestDevice({ filters: [{ vendorId: sonyVendorId }] });
      await device.open();
      if (device.configuration === null) await device.selectConfiguration(1);
      await device.claimInterface(0);
      this.device = new PasoriDevice(device);
      return this.device;
    }
    async waitForNfcIdm(options = {}) {
      if (options.signal?.aborted) throw abortError();
      const device = await this.connectPasori();
      const intervalMilliseconds = Math.max(100, options.intervalMilliseconds ?? 250);
      return new Promise((resolve, reject) => {
        let timer;
        const cleanup = () => {
          if (timer !== void 0) clearTimeout(timer);
          options.signal?.removeEventListener("abort", onAbort);
        };
        const onAbort = () => {
          cleanup();
          reject(abortError());
        };
        const tick = () => {
          void device.readIDm().then((idm) => {
            if (options.signal?.aborted) {
              onAbort();
              return;
            }
            if (idm) {
              this.lastIdm = idm;
              cleanup();
              resolve(idm);
              return;
            }
            timer = setTimeout(tick, intervalMilliseconds);
          }).catch((error) => {
            cleanup();
            reject(error);
          });
        };
        options.signal?.addEventListener("abort", onAbort, { once: true });
        tick();
      });
    }
    toScratchBlock(block) {
      return {
        opcode: block.opcode,
        blockType: Scratch.BlockType[block.blockType],
        text: Scratch.translate(block.text),
        arguments: Object.fromEntries(
          Object.entries(block.arguments).map(([name, argument]) => [
            name,
            {
              type: Scratch.ArgumentType[argument.type],
              defaultValue: argument.defaultValue
            }
          ])
        )
      };
    }
    runtime() {
      return Scratch.vm.runtime;
    }
    writeRuntimeVariable(name, value) {
      const runtimeVariable = String(name ?? "").trim();
      if (!runtimeVariable) throw new Error("RUNTIME_VAR must be specified.");
      const temporaryVariables = this.runtime().ext_lmsTempVars2;
      if (!temporaryVariables || typeof temporaryVariables.setRuntimeVariable !== "function") {
        throw new Error(
          "Temporary Variables (lmsTempVars2) must be loaded before using WebUSB PaSoRi blocks."
        );
      }
      temporaryVariables.setRuntimeVariable({ VAR: runtimeVariable, STRING: value });
    }
  }
  if (!Scratch.extensions.unsandboxed) {
    throw new Error(`${extensionConfig.name} must run unsandboxed.`);
  }
  Scratch.extensions.register(new WebUsbPasoriExtension());

})(Scratch);
