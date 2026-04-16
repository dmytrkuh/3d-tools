import { vi } from 'vitest';
import { JSDOM } from 'jsdom';

const { window } = new JSDOM('');

Object.defineProperty(globalThis, 'DOMParser', {
  writable: true,
  value: window.DOMParser,
});

class TestAnchorElement {
  href = '';
  download = '';
  click() {}
}

Object.defineProperty(globalThis, 'HTMLAnchorElement', {
  writable: true,
  value: TestAnchorElement,
});

Object.defineProperty(globalThis, 'document', {
  writable: true,
  value: {
    createElement: vi.fn((tagName: string) => {
      if (tagName === 'a') return new TestAnchorElement();
      return {};
    }),
  },
});

Object.defineProperty(URL, 'createObjectURL', {
  writable: true,
  value: vi.fn(() => 'blob:test-url'),
});

Object.defineProperty(URL, 'revokeObjectURL', {
  writable: true,
  value: vi.fn(),
});

TestAnchorElement.prototype.click = vi.fn();
