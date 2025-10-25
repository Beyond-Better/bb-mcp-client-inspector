/**
 * Trigger Error Tool Tests
 */

import { assertEquals, assertExists } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { getTools } from "../../../../mcp-server/src/plugins/inspector.plugin/tools/triggerError.ts";
import { createMockToolDependencies } from "../../../utils/mocks.ts";
import { assertRejects } from "../../../utils/test-helpers.ts";

describe("Trigger Error Tool", () => {
  const dependencies = createMockToolDependencies();
  const [triggerErrorTool] = getTools(dependencies);

  it("should have correct tool definition", () => {
    assertEquals(triggerErrorTool.name, "trigger_error");
    assertEquals(triggerErrorTool.definition.title, "Trigger Error");
    assertEquals(triggerErrorTool.definition.category, "Testing");
    assertExists(triggerErrorTool.definition.inputSchema);
  });

  it("should trigger validation error", async () => {
    const result = await triggerErrorTool.handler({
      errorType: "validation",
      message: "Invalid input",
    });

    assertEquals(result.isError, true);
    assertExists(result.content);
    assertEquals((result.content[0] as any).text.includes("Validation Error"), true);
    assertEquals((result.content[0] as any).text.includes("Invalid input"), true);
  });

  it("should trigger runtime error", async () => {
    await assertRejects(
      () => triggerErrorTool.handler({
        errorType: "runtime",
        message: "Something went wrong",
      }),
      (error) => {
        assertEquals(error.message.includes("Runtime Error"), true);
        assertEquals(error.message.includes("Something went wrong"), true);
        return true;
      },
    );
  });

  it("should trigger custom error", async () => {
    const result = await triggerErrorTool.handler({
      errorType: "custom",
      message: "Custom error message",
    });

    assertEquals(result.isError, true);
    assertEquals(result.content[0].text, "Custom error message");
  });

  it("should use default message when not provided", async () => {
    const result = await triggerErrorTool.handler({
      errorType: "validation",
    });

    assertEquals(result.isError, true);
    assertEquals((result.content[0] as any).text.includes("Triggered validation error"), true);
  });

  it("should apply delay before error", async () => {
    const startTime = Date.now();
    const delayMs = 100;

    const result = await triggerErrorTool.handler({
      errorType: "validation",
      delay: delayMs,
    });

    const duration = Date.now() - startTime;
    assertEquals(duration >= delayMs, true);
    assertEquals(result.isError, true);
  });

  it("should delay before runtime error", async () => {
    const startTime = Date.now();
    const delayMs = 100;

    await assertRejects(
      () => triggerErrorTool.handler({
        errorType: "runtime",
        delay: delayMs,
      }),
    );

    const duration = Date.now() - startTime;
    assertEquals(duration >= delayMs, true);
  });

  it("should handle validation error with custom message", async () => {
    const customMsg = "Field 'email' is required";
    const result = await triggerErrorTool.handler({
      errorType: "validation",
      message: customMsg,
    });

    assertEquals((result.content[0] as any).text.includes(customMsg), true);
  });

  it("should handle runtime error with custom message", async () => {
    const customMsg = "Database connection failed";

    await assertRejects(
      () => triggerErrorTool.handler({
        errorType: "runtime",
        message: customMsg,
      }),
      (error) => error.message.includes(customMsg),
    );
  });
});
