/**
 * useConsoleState Hook Tests
 */

import { assertEquals } from "@std/assert";
import { describe, it, afterEach } from "@std/testing/bdd";
import {
  activeTab,
  messageFilter,
  notificationLevel,
  notificationLogger,
  notificationMessage,
  selectedClientId,
  selectedMessage,
} from "../../../../fresh-ui/hooks/useConsoleState.ts";

describe("useConsoleState Hook", () => {
  afterEach(() => {
    // Reset all signals to default values
    selectedClientId.value = null;
    selectedMessage.value = null;
    messageFilter.value = "all";
    notificationLevel.value = "info";
    notificationLogger.value = "test";
    notificationMessage.value = "Test notification";
    activeTab.value = "notifications";
  });

  describe("selectedClientId", () => {
    it("should have initial value of null", () => {
      assertEquals(selectedClientId.value, null);
    });

    it("should update selected client", () => {
      const clientId = "test-client-1" as any;
      selectedClientId.value = clientId;
      assertEquals(selectedClientId.value, clientId);
    });

    it("should clear selected client", () => {
      selectedClientId.value = "test-client-1" as any;
      selectedClientId.value = null;
      assertEquals(selectedClientId.value, null);
    });
  });

  describe("selectedMessage", () => {
    it("should have initial value of null", () => {
      assertEquals(selectedMessage.value, null);
    });

    it("should update selected message index", () => {
      selectedMessage.value = 5;
      assertEquals(selectedMessage.value, 5);
    });

    it("should handle zero index", () => {
      selectedMessage.value = 0;
      assertEquals(selectedMessage.value, 0);
    });

    it("should clear selected message", () => {
      selectedMessage.value = 3;
      selectedMessage.value = null;
      assertEquals(selectedMessage.value, null);
    });
  });

  describe("messageFilter", () => {
    it("should have initial value of 'all'", () => {
      assertEquals(messageFilter.value, "all");
    });

    it("should update filter value", () => {
      messageFilter.value = "errors";
      assertEquals(messageFilter.value, "errors");
    });

    it("should handle different filter types", () => {
      const filters = ["all", "incoming", "outgoing", "errors", "tools"];

      for (const filter of filters) {
        messageFilter.value = filter;
        assertEquals(messageFilter.value, filter);
      }
    });
  });

  describe("notificationLevel", () => {
    it("should have initial value of 'info'", () => {
      assertEquals(notificationLevel.value, "info");
    });

    it("should update notification level", () => {
      notificationLevel.value = "error";
      assertEquals(notificationLevel.value, "error");
    });

    it("should handle all notification levels", () => {
      const levels = [
        "debug",
        "info",
        "notice",
        "warning",
        "error",
        "critical",
        "alert",
        "emergency",
      ] as const;

      for (const level of levels) {
        notificationLevel.value = level;
        assertEquals(notificationLevel.value, level);
      }
    });
  });

  describe("notificationLogger", () => {
    it("should have initial value of 'test'", () => {
      assertEquals(notificationLogger.value, "test");
    });

    it("should update logger name", () => {
      notificationLogger.value = "custom-logger";
      assertEquals(notificationLogger.value, "custom-logger");
    });

    it("should handle empty logger name", () => {
      notificationLogger.value = "";
      assertEquals(notificationLogger.value, "");
    });
  });

  describe("notificationMessage", () => {
    it("should have initial value", () => {
      assertEquals(notificationMessage.value, "Test notification");
    });

    it("should update notification message", () => {
      const message = "Custom notification message";
      notificationMessage.value = message;
      assertEquals(notificationMessage.value, message);
    });

    it("should handle empty message", () => {
      notificationMessage.value = "";
      assertEquals(notificationMessage.value, "");
    });

    it("should handle long messages", () => {
      const longMessage = "a".repeat(1000);
      notificationMessage.value = longMessage;
      assertEquals(notificationMessage.value.length, 1000);
    });
  });

  describe("activeTab", () => {
    it("should have initial value of 'notifications'", () => {
      assertEquals(activeTab.value, "notifications");
    });

    it("should update active tab", () => {
      activeTab.value = "sampling";
      assertEquals(activeTab.value, "sampling");
    });

    it("should handle different tab values", () => {
      const tabs = ["notifications", "sampling", "elicitation", "clients"];

      for (const tab of tabs) {
        activeTab.value = tab;
        assertEquals(activeTab.value, tab);
      }
    });
  });

  describe("signal independence", () => {
    it("should update signals independently", () => {
      notificationLevel.value = "warning";
      notificationLogger.value = "app";
      activeTab.value = "sampling";

      assertEquals(notificationLevel.value, "warning");
      assertEquals(notificationLogger.value, "app");
      assertEquals(activeTab.value, "sampling");
      // Other signals should remain at defaults
      assertEquals(selectedClientId.value, null);
    });
  });

  describe("module-level state persistence", () => {
    it("should persist state across multiple accesses", () => {
      // Set a value
      notificationLevel.value = "critical";
      assertEquals(notificationLevel.value, "critical");

      // Value should persist
      assertEquals(notificationLevel.value, "critical");

      // Change it
      notificationLevel.value = "debug";
      assertEquals(notificationLevel.value, "debug");
    });
  });

  describe("state reset", () => {
    it("should reset all state values", () => {
      // Set various values
      selectedClientId.value = "client-123" as any;
      selectedMessage.value = 5;
      messageFilter.value = "errors";
      notificationLevel.value = "warning";
      notificationLogger.value = "custom";
      notificationMessage.value = "Custom message";
      activeTab.value = "sampling";

      // Reset
      selectedClientId.value = null;
      selectedMessage.value = null;
      messageFilter.value = "all";
      notificationLevel.value = "info";
      notificationLogger.value = "test";
      notificationMessage.value = "Test notification";
      activeTab.value = "notifications";

      // Check reset
      assertEquals(selectedClientId.value, null);
      assertEquals(selectedMessage.value, null);
      assertEquals(messageFilter.value, "all");
      assertEquals(notificationLevel.value, "info");
      assertEquals(notificationLogger.value, "test");
      assertEquals(notificationMessage.value, "Test notification");
      assertEquals(activeTab.value, "notifications");
    });
  });
});
