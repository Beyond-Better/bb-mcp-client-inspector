/**
 * Delay Response Tool Tests
 */

import { assertEquals, assertExists } from '@std/assert';
import { describe, it } from '@std/testing/bdd';
import { getTools } from '../../../../mcp-server/src/plugins/inspector.plugin/tools/delayResponse.ts';
import { createMockToolDependencies } from '../../../utils/mocks.ts';

describe('Delay Response Tool', () => {
  const dependencies = createMockToolDependencies();
  const [delayResponseTool] = getTools(dependencies);

  it('should have correct tool definition', () => {
    assertEquals(delayResponseTool.name, 'delay_response');
    assertEquals(delayResponseTool.definition.title, 'Delay Response');
    assertEquals(delayResponseTool.definition.category, 'Testing');
    assertExists(delayResponseTool.definition.inputSchema);
  });

  it('should delay for specified duration', async () => {
    const startTime = Date.now();
    const delayMs = 100;

    const result = await delayResponseTool.handler({
      delay: delayMs,
    });

    const duration = Date.now() - startTime;
    assertExists(result.content);

    const data = JSON.parse((result.content[0] as any).text);
    assertEquals(data.requestedDelay, delayMs);
    assertEquals(
      duration >= delayMs,
      true,
      `Expected delay of at least ${delayMs}ms, got ${duration}ms`,
    );
    assertEquals(data.actualDelay >= delayMs, true);
  });

  it('should return custom message after delay', async () => {
    const customMessage = 'Custom delay message';
    const result = await delayResponseTool.handler({
      delay: 50,
      message: customMessage,
    });

    const data = JSON.parse((result.content[0] as any).text);
    assertEquals(data.message, customMessage);
  });

  it('should use default message when not provided', async () => {
    const result = await delayResponseTool.handler({
      delay: 50,
    });

    const data = JSON.parse((result.content[0] as any).text);
    assertEquals(data.message, 'Delay completed');
  });

  it('should handle zero delay', async () => {
    const startTime = Date.now();
    const result = await delayResponseTool.handler({
      delay: 0,
    });

    const duration = Date.now() - startTime;
    const data = JSON.parse((result.content[0] as any).text);
    assertEquals(data.requestedDelay, 0);
    // Should complete very quickly
    assertEquals(duration < 50, true);
  });

  it('should report accurate actual delay', async () => {
    const requestedDelay = 200;
    const result = await delayResponseTool.handler({
      delay: requestedDelay,
    });

    const data = JSON.parse((result.content[0] as any).text);
    assertEquals(data.requestedDelay, requestedDelay);
    // Actual delay should be close to requested (within 50ms tolerance)
    assertEquals(Math.abs(data.actualDelay - requestedDelay) < 50, true);
  });

  it('should handle short delays', async () => {
    const result = await delayResponseTool.handler({
      delay: 10,
    });

    const data = JSON.parse((result.content[0] as any).text);
    assertEquals(data.requestedDelay, 10);
    assertExists(data.actualDelay);
  });

  it('should handle longer delays', async () => {
    const startTime = Date.now();
    const result = await delayResponseTool.handler({
      delay: 500,
    });

    const duration = Date.now() - startTime;
    assertEquals(duration >= 500, true);

    const data = JSON.parse((result.content[0] as any).text);
    assertEquals(data.requestedDelay, 500);
  });

  it('should include all fields in response', async () => {
    const result = await delayResponseTool.handler({
      delay: 50,
      message: 'Test',
    });

    const data = JSON.parse((result.content[0] as any).text);
    assertExists(data.requestedDelay);
    assertExists(data.actualDelay);
    assertExists(data.message);
  });

  it('should handle multiple consecutive delays', async () => {
    const delays = [50, 75, 100];

    for (const delayMs of delays) {
      const startTime = Date.now();
      const result = await delayResponseTool.handler({ delay: delayMs });
      const duration = Date.now() - startTime;

      assertEquals(duration >= delayMs, true);
      const data = JSON.parse((result.content[0] as any).text);
      assertEquals(data.requestedDelay, delayMs);
    }
  });
});
