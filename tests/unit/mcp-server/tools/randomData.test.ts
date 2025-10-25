/**
 * Random Data Tool Tests
 */

import { assertEquals, assertExists } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { getTools } from "../../../../mcp-server/src/plugins/inspector.plugin/tools/randomData.ts";
import { createMockToolDependencies } from "../../../utils/mocks.ts";

describe("Random Data Tool", () => {
  const dependencies = createMockToolDependencies();
  const [randomDataTool] = getTools(dependencies);

  it("should have correct tool definition", () => {
    assertEquals(randomDataTool.name, "random_data");
    assertEquals(randomDataTool.definition.title, "Random Data");
    assertEquals(randomDataTool.definition.category, "Testing");
    assertExists(randomDataTool.definition.inputSchema);
  });

  it("should generate random numbers", async () => {
    const result = await randomDataTool.handler({
      type: "number",
      count: 5,
    });

    assertExists(result.content);
    const data = JSON.parse((result.content[0] as any).text);
    assertEquals(data.type, "number");
    assertEquals(data.count, 5);
    assertEquals(Array.isArray(data.data), true);
    assertEquals(data.data.length, 5);
    assertEquals(typeof data.data[0], "number");
  });

  it("should generate random strings", async () => {
    const result = await randomDataTool.handler({
      type: "string",
      count: 3,
    });

    const data = JSON.parse((result.content[0] as any).text);
    assertEquals(data.type, "string");
    assertEquals(data.data.length, 3);
    assertEquals(typeof data.data[0], "string");
  });

  it("should generate random booleans", async () => {
    const result = await randomDataTool.handler({
      type: "boolean",
      count: 10,
    });

    const data = JSON.parse((result.content[0] as any).text);
    assertEquals(data.type, "boolean");
    assertEquals(data.data.length, 10);
    assertEquals(typeof data.data[0], "boolean");
  });

  it("should generate random arrays", async () => {
    const result = await randomDataTool.handler({
      type: "array",
      count: 2,
    });

    const data = JSON.parse((result.content[0] as any).text);
    assertEquals(data.type, "array");
    assertEquals(data.data.length, 2);
    assertEquals(Array.isArray(data.data[0]), true);
  });

  it("should generate random objects", async () => {
    const result = await randomDataTool.handler({
      type: "object",
      count: 3,
    });

    const data = JSON.parse((result.content[0] as any).text);
    assertEquals(data.type, "object");
    assertEquals(data.data.length, 3);
    assertEquals(typeof data.data[0], "object");
    assertExists(data.data[0].id);
    assertExists(data.data[0].name);
    assertExists(data.data[0].value);
    assertExists(data.data[0].active);
  });

  it("should use default count of 1", async () => {
    const result = await randomDataTool.handler({
      type: "number",
    });

    const data = JSON.parse((result.content[0] as any).text);
    assertEquals(data.count, 1);
    assertEquals(data.data.length, 1);
  });

  it("should generate reproducible data with seed", async () => {
    const seed = 12345;

    const result1 = await randomDataTool.handler({
      type: "number",
      count: 5,
      seed,
    });

    const result2 = await randomDataTool.handler({
      type: "number",
      count: 5,
      seed,
    });

    const data1 = JSON.parse((result1.content[0] as any).text);
    const data2 = JSON.parse((result2.content[0] as any).text);

    assertEquals(data1.data, data2.data);
  });

  it("should generate different data with different seeds", async () => {
    const result1 = await randomDataTool.handler({
      type: "number",
      count: 5,
      seed: 123,
    });

    const result2 = await randomDataTool.handler({
      type: "number",
      count: 5,
      seed: 456,
    });

    const data1 = JSON.parse((result1.content[0] as any).text);
    const data2 = JSON.parse((result2.content[0] as any).text);

    // At least some values should be different
    const allSame = data1.data.every((val: number, i: number) => val === data2.data[i]);
    assertEquals(allSame, false);
  });

  it("should generate different data without seed", async () => {
    const result1 = await randomDataTool.handler({
      type: "number",
      count: 10,
    });

    const result2 = await randomDataTool.handler({
      type: "number",
      count: 10,
    });

    const data1 = JSON.parse((result1.content[0] as any).text);
    const data2 = JSON.parse((result2.content[0] as any).text);

    // Very unlikely to be all the same
    const allSame = data1.data.every((val: number, i: number) => val === data2.data[i]);
    assertEquals(allSame, false);
  });

  it("should include seed in response when provided", async () => {
    const seed = 999;
    const result = await randomDataTool.handler({
      type: "number",
      seed,
    });

    const data = JSON.parse((result.content[0] as any).text);
    assertEquals(data.seed, seed);
  });

  it("should handle maximum count", async () => {
    const result = await randomDataTool.handler({
      type: "number",
      count: 100,
    });

    const data = JSON.parse((result.content[0] as any).text);
    assertEquals(data.data.length, 100);
  });

  it("should generate object with correct structure", async () => {
    const result = await randomDataTool.handler({
      type: "object",
      count: 1,
    });

    const data = JSON.parse((result.content[0] as any).text);
    const obj = data.data[0];
    
    assertEquals(typeof obj.id, "number");
    assertEquals(typeof obj.name, "string");
    assertEquals(typeof obj.value, "number");
    assertEquals(typeof obj.active, "boolean");
  });

  it("should generate array with expected structure", async () => {
    const result = await randomDataTool.handler({
      type: "array",
      count: 1,
    });

    const data = JSON.parse((result.content[0] as any).text);
    const arr = data.data[0];
    
    assertEquals(Array.isArray(arr), true);
    assertEquals(arr.length, 3);
  });
});
