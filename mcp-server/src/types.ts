/**
 * Inspector-specific type definitions
 * 
 * Extends base bb-mcp-server types with inspector-specific functionality.
 */

import type { AppServerDependencies } from '@beyondbetter/bb-mcp-server';
import type { MessageTracker } from './console/MessageTracker.ts';
import type { ConsoleManager } from './console/ConsoleManager.ts';

/**
 * Extended dependencies for Inspector server
 * 
 * Adds inspector-specific dependencies to the base AppServerDependencies.
 */
export interface InspectorDependencies extends AppServerDependencies {
  messageTracker?: MessageTracker;
  consoleManager?: ConsoleManager;
}
