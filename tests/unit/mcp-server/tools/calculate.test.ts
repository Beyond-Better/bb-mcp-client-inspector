/**
 * Calculate Tool Tests
 */

import { assertEquals, assertExists } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { getTools } from "../../../../mcp-server/src/plugins/inspector.plugin/tools/calculate.ts";
import { createMockToolDependencies } from "../../../utils/mocks.ts";

describe("Calculate Tool", () => {
  const dependencies = createMockToolDependencies();
  const [calculateTool] = getTools(dependencies);

  it("should have correct tool definition", () => {
    assertEquals(calculateTool.name, "calculate");
    assertEquals(calculateTool.definition.title, "Calculate");
    assertEquals(calculateTool.definition.category, "Utility");
    assertExists(calculateTool.definition.inputSchema);
  });

  it("should add two numbers", async () => {
    const result = await calculateTool.handler({
      operation: "add",
      a: 5,
      b: 3,
    });

    assertExists(result.content);
    const data = JSON.parse((result.content[0] as any).text);
    assertEquals(data.operation, "add");
    assertEquals(data.result, 8);
  });

  it("should subtract two numbers", async () => {
    const result = await calculateTool.handler({
      operation: "subtract",
      a: 10,
      b: 3,
    });

    const data = JSON.parse((result.content[0] as any).text);
    assertEquals(data.result, 7);
  });

  it("should multiply two numbers", async () => {
    const result = await calculateTool.handler({
      operation: "multiply",
      a: 4,
      b: 5,
    });

    const data = JSON.parse((result.content[0] as any).text);
    assertEquals(data.result, 20);
  });

  it("should divide two numbers", async () => {
    const result = await calculateTool.handler({
      operation: "divide",
      a: 20,
      b: 4,
    });

    const data = JSON.parse((result.content[0] as any).text);
    assertEquals(data.result, 5);
  });

  it("should handle division by zero", async () => {
    const result = await calculateTool.handler({
      operation: "divide",
      a: 10,
      b: 0,
    });

    assertEquals(result.isError, true);
    assertEquals(result.content[0].text, "Error: Division by zero");
  });

  it("should calculate power", async () => {
    const result = await calculateTool.handler({
      operation: "power",
      a: 2,
      b: 3,
    });

    const data = JSON.parse((result.content[0] as any).text);
    assertEquals(data.result, 8);
  });

  it("should calculate modulo", async () => {
    const result = await calculateTool.handler({
      operation: "modulo",
      a: 10,
      b: 3,
    });

    const data = JSON.parse((result.content[0] as any).text);
    assertEquals(data.result, 1);
  });

  it("should handle negative numbers", async () => {
    const result = await calculateTool.handler({
      operation: "add",
      a: -5,
      b: 3,
    });

    const data = JSON.parse((result.content[0] as any).text);
    assertEquals(data.result, -2);
  });

  it("should handle decimal numbers", async () => {
    const result = await calculateTool.handler({
      operation: "multiply",
      a: 2.5,
      b: 4.2,
    });

    const data = JSON.parse((result.content[0] as any).text);
    assertEquals(Math.abs(data.result - 10.5) < 0.01, true);
  });

  it("should handle zero as operand", async () => {
    const result = await calculateTool.handler({
      operation: "multiply",
      a: 0,
      b: 5,
    });

    const data = JSON.parse((result.content[0] as any).text);
    assertEquals(data.result, 0);
  });

  it("should handle very large numbers", async () => {
    const result = await calculateTool.handler({
      operation: "multiply",
      a: 999999,
      b: 999999,
    });

    const data = JSON.parse((result.content[0] as any).text);
    assertEquals(data.result, 999998000001);
  });

  it("should include operands in result", async () => {
    const result = await calculateTool.handler({
      operation: "add",
      a: 5,
      b: 3,
    });

    const data = JSON.parse((result.content[0] as any).text);
    assertExists(data.operands);
    assertEquals(data.operands[0], 5);
    assertEquals(data.operands[1], 3);
  });

  it("should handle power with negative exponent", async () => {
    const result = await calculateTool.handler({
      operation: "power",
      a: 2,
      b: -2,
    });

    const data = JSON.parse((result.content[0] as any).text);
    assertEquals(data.result, 0.25);
  });

  it("should handle power with fractional exponent", async () => {
    const result = await calculateTool.handler({
      operation: "power",
      a: 9,
      b: 0.5,
    });

    const data = JSON.parse((result.content[0] as any).text);
    assertEquals(data.result, 3);
  });
});
