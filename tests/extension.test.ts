import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {WebUsbPasoriExtension} from '../src/extension.js';

function scratch() {
  return {
    vm: {runtime: {}},
    extensions: {unsandboxed: true, register: vi.fn()},
    BlockType: {COMMAND: 'command', REPORTER: 'reporter'},
    ArgumentType: {STRING: 'string'},
    translate: (message: string) => message
  };
}

function usbDevice() {
  return {
    opened: false,
    configuration: null,
    open: vi.fn(async function open(this: {opened: boolean}) {
      this.opened = true;
    }),
    selectConfiguration: vi.fn(async () => undefined),
    claimInterface: vi.fn(async () => undefined),
    close: vi.fn(async () => undefined),
    transferIn: vi.fn(async () => ({data: new DataView(new ArrayBuffer(0))})),
    transferOut: vi.fn(async () => undefined)
  };
}

beforeEach(() => {
  vi.stubGlobal('Scratch', scratch());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('WebUsbPasoriExtension', () => {
  it('registers a runtime capability and reports metadata', () => {
    const extension = new WebUsbPasoriExtension();
    expect(Scratch.vm.runtime.ext_kubohiroyawebusbpasori).toBe(extension);
    const info = extension.getInfo() as {name: string; blocks: Array<{text: string}>};
    expect(info.name).toBe('WebUSB PaSoRi');
    expect(info.blocks.map((block) => block.text)).toContain(
      'last NFC IDm on PaSoRi [READER_ID]'
    );
    expect(extension.lastIdmReporter({READER_ID: 'left'})).toBe('');
  });

  it('reports unsupported WebUSB when connecting without navigator.usb', async () => {
    const extension = new WebUsbPasoriExtension();
    await expect(extension.connectPasori()).rejects.toThrow(/navigator\.usb/u);
  });

  it('keeps separate named PaSoRi devices', async () => {
    const left = usbDevice();
    const right = usbDevice();
    const requestDevice = vi.fn()
      .mockResolvedValueOnce(left)
      .mockResolvedValueOnce(right);
    vi.stubGlobal('navigator', {usb: {requestDevice}});
    const extension = new WebUsbPasoriExtension();

    const leftDevice = await extension.connectPasori({readerId: 'left'});
    const rightDevice = await extension.connectPasori({readerId: 'right'});
    const leftAgain = await extension.connectPasori({readerId: 'left'});

    expect(leftDevice).toBe(leftAgain);
    expect(leftDevice).not.toBe(rightDevice);
    expect(requestDevice).toHaveBeenCalledTimes(2);
    expect(extension.connectedPasoriCount()).toBe(2);
    expect(left.claimInterface).toHaveBeenCalledWith(0);
    expect(right.claimInterface).toHaveBeenCalledWith(0);
  });
});
