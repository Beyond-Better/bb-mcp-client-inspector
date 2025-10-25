/**
 * Echo Tool Tests
 */

import { assertEquals, assertExists } from '@std/assert';
import { describe, it } from '@std/testing/bdd';
import { getTools } from '../../../../mcp-server/src/plugins/inspector.plugin/tools/echo.ts';
import { createMockToolDependencies } from '../../../utils/mocks.ts';
import { delay } from '../../../utils/test-helpers.ts';

describe('Echo Tool', () => {
  const dependencies = createMockToolDependencies();
  const [echoTool] = getTools(dependencies);

  it('should have correct tool definition', () => {
    assertEquals(echoTool.name, 'echo');
    assertEquals(echoTool.definition.title, 'Echo');
    assertEquals(echoTool.definition.category, 'Testing');
    assertExists(echoTool.definition.inputSchema);
  });

  it('should echo back the message', async () => {
    const result = await echoTool.handler({
      message: 'Hello, World!',
    });

    assertExists(result.content);
    assertEquals(result.content.length, 1);
    assertEquals(result.content[0].type, 'text');
    assertEquals(result.content[0].text, 'Hello, World!');
  });

  it('should echo empty message', async () => {
    const result = await echoTool.handler({
      message: '',
    });

    assertExists(result.content);
    assertEquals(result.content[0].text, '');
  });

  it('should apply delay if specified', async () => {
    const startTime = Date.now();
    const delayMs = 100;

    await echoTool.handler({
      message: 'test',
      delay: delayMs,
    });

    const duration = Date.now() - startTime;
    assertEquals(
      duration >= delayMs,
      true,
      `Expected delay of at least ${delayMs}ms, got ${duration}ms`,
    );
  });

  it('should convert to uppercase if requested', async () => {
    const result = await echoTool.handler({
      message: 'hello world',
      uppercase: true,
    });

    assertEquals(result.content[0].text, 'HELLO WORLD');
  });

  it('should handle both uppercase and delay', async () => {
    const startTime = Date.now();

    const result = await echoTool.handler({
      message: 'test message',
      uppercase: true,
      delay: 50,
    });

    const duration = Date.now() - startTime;
    assertEquals(duration >= 50, true);
    assertEquals(result.content[0].text, 'TEST MESSAGE');
  });

  it('should handle special characters', async () => {
    const specialMessage = "Test with special chars: !@#$%^&*()_+-=[]{}|;':,.<>?";
    const result = await echoTool.handler({
      message: specialMessage,
    });

    assertEquals(result.content[0].text, specialMessage);
  });

  it('should handle unicode characters', async () => {
    const unicodeMessage = 'Hello 世界 🌍';
    const result = await echoTool.handler({
      message: unicodeMessage,
    });

    assertEquals(result.content[0].text, unicodeMessage);
  });

  it('should handle multi-line messages', async () => {
    const multilineMessage = 'Line 1\nLine 2\nLine 3';
    const result = await echoTool.handler({
      message: multilineMessage,
    });

    assertEquals(result.content[0].text, multilineMessage);
  });

  it('should not modify message when uppercase is false', async () => {
    const result = await echoTool.handler({
      message: 'Mixed Case Message',
      uppercase: false,
    });

    assertEquals(result.content[0].text, 'Mixed Case Message');
  });

  it('should handle very long messages', async () => {
    const longMessage = 'a'.repeat(10000);
    const result = await echoTool.handler({
      message: longMessage,
    });

    assertEquals((result.content[0] as any).text.length, 10000);
  });
});
