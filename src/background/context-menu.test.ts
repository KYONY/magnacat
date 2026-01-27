import { describe, it, expect, vi, beforeEach } from "vitest";
import { setupContextMenu, handleContextMenuClick } from "./context-menu";
import { resetChromeContextMenus } from "../test-setup";

vi.mock("./handlers", () => ({
  handleMessage: vi.fn(),
}));

import { handleMessage } from "./handlers";
const mockHandleMessage = vi.mocked(handleMessage);

describe("context-menu", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetChromeContextMenus();
  });

  describe("setupContextMenu", () => {
    it("creates context menu with correct properties", () => {
      setupContextMenu();
      expect(chrome.contextMenus.create).toHaveBeenCalledWith({
        id: "magnacat-translate",
        title: "Translate with Magnacat",
        contexts: ["selection"],
      });
    });
  });

  describe("handleContextMenuClick", () => {
    it("sends TRANSLATE message when selection text is provided", async () => {
      mockHandleMessage.mockResolvedValue({ success: true, data: "привіт" });

      const info = {
        menuItemId: "magnacat-translate",
        selectionText: "hello",
      } as chrome.contextMenus.OnClickData;

      const result = await handleContextMenuClick(info);
      expect(mockHandleMessage).toHaveBeenCalled();
      expect(result).toEqual({ success: true, data: "привіт" });
    });

    it("detects language before translating", async () => {
      mockHandleMessage
        .mockResolvedValueOnce({ success: true, data: "en" })
        .mockResolvedValueOnce({ success: true, data: "привіт" });

      const info = {
        menuItemId: "magnacat-translate",
        selectionText: "hello",
      } as chrome.contextMenus.OnClickData;

      await handleContextMenuClick(info);

      expect(mockHandleMessage).toHaveBeenCalledWith(
        expect.objectContaining({ type: "DETECT_LANG", text: "hello" })
      );
      expect(mockHandleMessage).toHaveBeenCalledWith(
        expect.objectContaining({ type: "TRANSLATE" })
      );
    });

    it("returns null when no selection text", async () => {
      const info = {
        menuItemId: "magnacat-translate",
        selectionText: undefined,
      } as unknown as chrome.contextMenus.OnClickData;

      const result = await handleContextMenuClick(info);
      expect(result).toBeNull();
      expect(mockHandleMessage).not.toHaveBeenCalled();
    });

    it("returns null for wrong menu item", async () => {
      const info = {
        menuItemId: "other-item",
        selectionText: "hello",
      } as chrome.contextMenus.OnClickData;

      const result = await handleContextMenuClick(info);
      expect(result).toBeNull();
    });
  });
});
