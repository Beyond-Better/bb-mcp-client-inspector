/**
 * Convert Date Tool Tests
 */

import { assertEquals, assertExists } from '@std/assert';
import { describe, it } from '@std/testing/bdd';
import { getTools } from '../../../../mcp-server/src/plugins/inspector.plugin/tools/convertDate.ts';
import { createMockToolDependencies } from '../../../utils/mocks.ts';

describe('Convert Date Tool', () => {
  const dependencies = createMockToolDependencies();
  const [convertDateTool] = getTools(dependencies);

  it('should have correct tool definition', () => {
    assertEquals(convertDateTool.name, 'convert_date');
    assertEquals(convertDateTool.definition.title, 'Convert Date');
    assertEquals(convertDateTool.definition.category, 'Utility');
    assertExists(convertDateTool.definition.inputSchema);
  });

  it('should convert date to ISO format', async () => {
    const result = await convertDateTool.handler({
      date: '2024-01-15T10:30:00.000Z',
      format: 'iso',
    });

    assertExists(result.content);
    const data = JSON.parse((result.content[0] as any).text);
    assertEquals(data.format, 'iso');
    assertEquals(data.converted, '2024-01-15T10:30:00.000Z');
  });

  it('should convert date to unix timestamp', async () => {
    const result = await convertDateTool.handler({
      date: '2024-01-15T10:30:00.000Z',
      format: 'unix',
    });

    const data = JSON.parse((result.content[0] as any).text);
    assertEquals(data.format, 'unix');
    const unixTime = parseInt(data.converted);
    assertEquals(unixTime > 0, true);
  });

  it('should convert date to human readable format', async () => {
    const result = await convertDateTool.handler({
      date: '2024-01-15T10:30:00.000Z',
      format: 'human',
      toTimezone: 'UTC',
    });

    const data = JSON.parse((result.content[0] as any).text);
    assertEquals(data.format, 'human');
    assertExists(data.converted);
  });

  it('should convert to date-only format', async () => {
    const result = await convertDateTool.handler({
      date: '2024-01-15T10:30:00.000Z',
      format: 'date-only',
    });

    const data = JSON.parse((result.content[0] as any).text);
    assertEquals(data.format, 'date-only');
    assertExists(data.converted);
  });

  it('should convert to time-only format', async () => {
    const result = await convertDateTool.handler({
      date: '2024-01-15T10:30:00.000Z',
      format: 'time-only',
    });

    const data = JSON.parse((result.content[0] as any).text);
    assertEquals(data.format, 'time-only');
    assertExists(data.converted);
  });

  it('should handle invalid date format', async () => {
    const result = await convertDateTool.handler({
      date: 'invalid-date',
      format: 'iso',
    });

    assertEquals(result.isError, true);
    assertEquals(
      (result.content[0] as any).text.includes('Invalid date format'),
      true,
    );
  });

  it('should use default timezone (UTC)', async () => {
    const result = await convertDateTool.handler({
      date: '2024-01-15T10:30:00.000Z',
      format: 'iso',
    });

    const data = JSON.parse((result.content[0] as any).text);
    assertEquals(data.timezone, 'UTC');
  });

  it('should include original date in result', async () => {
    const originalDate = '2024-01-15T10:30:00.000Z';
    const result = await convertDateTool.handler({
      date: originalDate,
      format: 'iso',
    });

    const data = JSON.parse((result.content[0] as any).text);
    assertEquals(data.original, originalDate);
  });

  it('should handle timezone conversion', async () => {
    const result = await convertDateTool.handler({
      date: '2024-01-15T10:30:00.000Z',
      format: 'human',
      fromTimezone: 'UTC',
      toTimezone: 'America/New_York',
    });

    const data = JSON.parse((result.content[0] as any).text);
    assertEquals(data.timezone, 'America/New_York');
  });

  it('should handle current date', async () => {
    const now = new Date();
    const result = await convertDateTool.handler({
      date: now.toISOString(),
      format: 'iso',
    });

    assertExists(result.content);
    const data = JSON.parse((result.content[0] as any).text);
    assertEquals(data.format, 'iso');
  });

  it('should handle dates far in the past', async () => {
    const result = await convertDateTool.handler({
      date: '1970-01-01T00:00:00.000Z',
      format: 'unix',
    });

    const data = JSON.parse((result.content[0] as any).text);
    assertEquals(data.converted, '0');
  });

  it('should handle dates far in the future', async () => {
    const result = await convertDateTool.handler({
      date: '2099-12-31T23:59:59.999Z',
      format: 'iso',
    });

    const data = JSON.parse((result.content[0] as any).text);
    assertExists(data.converted);
  });
});
