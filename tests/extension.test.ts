import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {WebUsbPasoriExtension} from '../src/extension.js';

function scratch() {
  return {
    vm: {runtime: {}},
    extensions: {unsandboxed: true, register: vi.fn()},
    BlockType: {REPORTER: 'reporter'},
    ArgumentType: {STRING: 'string'},
    translate: (message: string) => message
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
    expect(info.blocks.map((block) => block.text)).toContain('last NFC IDm');
    expect(extension.lastIdmReporter()).toBe('');
  });

  it('reports unsupported WebUSB when connecting without navigator.usb', async () => {
    const extension = new WebUsbPasoriExtension();
    await expect(extension.connectPasori()).rejects.toThrow(/navigator\.usb/u);
  });
});
