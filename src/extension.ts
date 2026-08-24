import {extensionConfig} from './config';
import definitions from './block-definitions.json';

type BlockTypeName = 'COMMAND' | 'REPORTER';
type ArgumentTypeName = 'STRING';

interface DefinitionArgument {
  type: ArgumentTypeName;
  defaultValue: string;
}

interface BlockDefinition {
  opcode: string;
  blockType: BlockTypeName;
  text: string;
  description: string;
  arguments: Record<string, DefinitionArgument>;
}

export interface PasoriCardInfo {
  readonly spec: string;
  readonly idm: string;
  readonly pmm: string | null;
}

export interface WaitForNfcIdmOptions {
  signal?: AbortSignal;
  intervalMilliseconds?: number;
}

const blockDefinitions = definitions.blocks as readonly BlockDefinition[];
const sonyVendorId = 0x054c;
const ack = Object.freeze([0x00, 0x00, 0xff, 0x00, 0xff, 0x00]);

function hex(bytes: readonly number[]): string {
  return bytes.map((value) => value.toString(16).padStart(2, '0')).join('').toUpperCase();
}

function abortError(): Error {
  const error = new Error('NFC reading was aborted.');
  error.name = 'AbortError';
  return error;
}

function webUsb(): USB {
  const usb = globalThis.navigator?.usb;
  if (!usb || typeof usb.requestDevice !== 'function') {
    throw new Error('WebUSB PaSoRi requires navigator.usb.requestDevice.');
  }
  return usb;
}

export class PasoriDevice {
  public constructor(private readonly device: USBDevice) {}

  public async release(): Promise<void> {
    if (this.device.opened) await this.device.close();
  }

  public async readCardInfo(): Promise<PasoriCardInfo | null> {
    await this.send([...ack]);
    await this.sendCommand(0x2a, [0x01]);
    const type2 = await this.getType2TagInfo();
    if (type2) return type2;
    return this.getType3TagInfo();
  }

  public async readIDm(): Promise<string> {
    return (await this.readCardInfo())?.idm ?? '';
  }

  private async receive(length: number): Promise<number[]> {
    const data = await this.device.transferIn(1, length);
    const view = data.data;
    if (!view) return [];
    return Array.from({length: view.byteLength}, (_unused, index) => view.getUint8(index));
  }

  private async send(data: number[]): Promise<void> {
    await this.device.transferOut(2, new Uint8Array(data));
  }

  private async sendCommand(commandCode: number, params: number[]): Promise<number[]> {
    const data = [0xd6, commandCode, ...params];
    const command = [0x00, 0x00, 0xff, 0xff, 0xff, data.length, 0, 256 - data.length, ...data];
    const sum = data.reduce((total, value) => total + value, 0);
    command.push((256 - sum) & 0xff, 0);
    await this.send(command);
    await this.receive(6);
    return this.receive(40);
  }

  private async getType2TagInfo(): Promise<PasoriCardInfo | null> {
    await this.sendCommand(0x06, [0x00]);
    await this.sendCommand(0x00, [0x02, 0x03, 0x0f, 0x03]);
    await this.sendCommand(0x02, [
      0x00, 0x18, 0x01, 0x01, 0x02, 0x01, 0x03, 0x00, 0x04, 0x00, 0x05, 0x00, 0x06,
      0x00, 0x07, 0x08, 0x08, 0x00, 0x09, 0x00, 0x0a, 0x00, 0x0b, 0x00, 0x0c, 0x00,
      0x0e, 0x04, 0x0f, 0x00, 0x10, 0x00, 0x11, 0x00, 0x12, 0x00, 0x13, 0x06
    ]);
    await this.sendCommand(0x02, [0x01, 0x00, 0x02, 0x00, 0x05, 0x01, 0x00, 0x06, 0x07, 0x07]);
    await this.sendCommand(0x04, [0x36, 0x01, 0x26]);
    await this.sendCommand(0x02, [0x04, 0x01, 0x07, 0x08]);
    await this.sendCommand(0x02, [0x01, 0x00, 0x02, 0x00]);
    const response = await this.sendCommand(0x04, [0x36, 0x01, 0x93, 0x20]);
    const idm = hex(response.slice(15, 19));
    return idm === '00' || idm.length === 0 ? null : {spec: 'Type2', idm, pmm: null};
  }

  private async getType3TagInfo(): Promise<PasoriCardInfo | null> {
    await this.sendCommand(0x2a, [0x01]);
    await this.sendCommand(0x06, [0x00]);
    await this.sendCommand(0x00, [0x01, 0x01, 0x0f, 0x01]);
    await this.sendCommand(0x02, [
      0x00, 0x18, 0x01, 0x01, 0x02, 0x01, 0x03, 0x00, 0x04, 0x00, 0x05, 0x00, 0x06,
      0x00, 0x07, 0x08, 0x08, 0x00, 0x09, 0x00, 0x0a, 0x00, 0x0b, 0x00, 0x0c, 0x00,
      0x0e, 0x04, 0x0f, 0x00, 0x10, 0x00, 0x11, 0x00, 0x12, 0x00, 0x13, 0x06
    ]);
    await this.sendCommand(0x02, [0x00, 0x18]);
    const data = await this.sendCommand(0x04, [0x6e, 0x00, 0x06, 0x00, 0xff, 0xff, 0x01, 0x00]);
    const idm = hex(data.slice(17, 25));
    if (idm.length === 0) return null;
    return {spec: 'Type3', idm, pmm: hex(data.slice(25, 33))};
  }
}

export class WebUsbPasoriExtension implements TurboWarpExtension {
  private device: PasoriDevice | null = null;
  private lastIdm = '';

  public constructor() {
    Scratch.vm.runtime.ext_kubohiroyawebusbpasori = this;
  }

  public getInfo(): Record<string, unknown> {
    return {
      id: extensionConfig.id,
      name: Scratch.translate(definitions.extensionName),
      blocks: blockDefinitions.map((block) => this.toScratchBlock(block))
    };
  }

  public lastIdmReporter(): string {
    return this.lastIdm;
  }

  public async connectPasoriBlock(): Promise<void> {
    await this.connectPasori();
  }

  public async waitForNfcIdmSetRuntimeVar(args: {RUNTIME_VAR: unknown}): Promise<void> {
    const idm = await this.waitForNfcIdm();
    this.writeRuntimeVariable(args.RUNTIME_VAR, idm);
  }

  public async waitForNfcIdmSetRuntimeVarAndBroadcast(
    args: {RUNTIME_VAR: unknown; MESSAGE: unknown}
  ): Promise<void> {
    const idm = await this.waitForNfcIdm();
    this.writeRuntimeVariable(args.RUNTIME_VAR, idm);
    const message = String(args.MESSAGE ?? '').trim();
    if (!message) throw new Error('MESSAGE must be specified.');
    this.runtime().startHats?.('event_whenbroadcastreceived', {BROADCAST_OPTION: message});
  }

  public async connectPasori(): Promise<PasoriDevice> {
    if (this.device) return this.device;
    const device = await webUsb().requestDevice({filters: [{vendorId: sonyVendorId}]});
    await device.open();
    if (device.configuration === null) await device.selectConfiguration(1);
    await device.claimInterface(0);
    this.device = new PasoriDevice(device);
    return this.device;
  }

  public async waitForNfcIdm(options: WaitForNfcIdmOptions = {}): Promise<string> {
    if (options.signal?.aborted) throw abortError();
    const device = await this.connectPasori();
    const intervalMilliseconds = Math.max(100, options.intervalMilliseconds ?? 250);
    return new Promise((resolve, reject) => {
      let timer: ReturnType<typeof setTimeout> | undefined;
      const cleanup = () => {
        if (timer !== undefined) clearTimeout(timer);
        options.signal?.removeEventListener('abort', onAbort);
      };
      const onAbort = () => {
        cleanup();
        reject(abortError());
      };
      const tick = () => {
        void device
          .readIDm()
          .then((idm) => {
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
          })
          .catch((error: unknown) => {
            cleanup();
            reject(error);
          });
      };
      options.signal?.addEventListener('abort', onAbort, {once: true});
      tick();
    });
  }

  private toScratchBlock(block: BlockDefinition): Record<string, unknown> {
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

  private runtime(): Record<string, unknown> & {
    ext_lmsTempVars2?: {
      setRuntimeVariable(args: {VAR: string; STRING: string}): void;
    };
    startHats?: (hat: string, args: Record<string, unknown>) => void;
  } {
    return Scratch.vm.runtime;
  }

  private writeRuntimeVariable(name: unknown, value: string): void {
    const runtimeVariable = String(name ?? '').trim();
    if (!runtimeVariable) throw new Error('RUNTIME_VAR must be specified.');
    const temporaryVariables = this.runtime().ext_lmsTempVars2;
    if (!temporaryVariables || typeof temporaryVariables.setRuntimeVariable !== 'function') {
      throw new Error(
        'Temporary Variables (lmsTempVars2) must be loaded before using WebUSB PaSoRi blocks.'
      );
    }
    temporaryVariables.setRuntimeVariable({VAR: runtimeVariable, STRING: value});
  }
}
