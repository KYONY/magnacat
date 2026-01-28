// Chrome API mocks for vitest
const storageMock: Record<string, unknown> = {};

const chromeStorageLocal = {
  get: vi.fn((keys: string | string[] | null) => {
    if (keys === null) return Promise.resolve({ ...storageMock });
    if (typeof keys === "string") {
      return Promise.resolve({ [keys]: storageMock[keys] });
    }
    const result: Record<string, unknown> = {};
    for (const key of keys) {
      if (key in storageMock) result[key] = storageMock[key];
    }
    return Promise.resolve(result);
  }),
  set: vi.fn((items: Record<string, unknown>) => {
    Object.assign(storageMock, items);
    return Promise.resolve();
  }),
  remove: vi.fn((keys: string | string[]) => {
    const toRemove = typeof keys === "string" ? [keys] : keys;
    for (const key of toRemove) delete storageMock[key];
    return Promise.resolve();
  }),
  clear: vi.fn(() => {
    for (const key of Object.keys(storageMock)) delete storageMock[key];
    return Promise.resolve();
  }),
};

const chromeRuntimeMock = {
  onMessage: {
    addListener: vi.fn(),
    removeListener: vi.fn(),
    hasListener: vi.fn(),
  },
  onInstalled: {
    addListener: vi.fn(),
  },
  sendMessage: vi.fn(),
};

const chromeContextMenusMock = {
  create: vi.fn(),
  onClicked: {
    addListener: vi.fn(),
  },
};

const chromeStorageOnChanged = {
  addListener: vi.fn(),
  removeListener: vi.fn(),
  hasListener: vi.fn(),
};

globalThis.chrome = {
  storage: {
    local: chromeStorageLocal,
    onChanged: chromeStorageOnChanged,
  },
  runtime: chromeRuntimeMock,
  contextMenus: chromeContextMenusMock,
} as unknown as typeof chrome;

// Helper to reset storage between tests
export function resetChromeStorage() {
  for (const key of Object.keys(storageMock)) delete storageMock[key];
  chromeStorageLocal.get.mockClear();
  chromeStorageLocal.set.mockClear();
  chromeStorageLocal.remove.mockClear();
  chromeStorageLocal.clear.mockClear();
}

export function resetChromeRuntime() {
  chromeRuntimeMock.onMessage.addListener.mockClear();
  chromeRuntimeMock.onInstalled.addListener.mockClear();
  chromeRuntimeMock.sendMessage.mockClear();
}

export function resetChromeContextMenus() {
  chromeContextMenusMock.create.mockClear();
  chromeContextMenusMock.onClicked.addListener.mockClear();
}
