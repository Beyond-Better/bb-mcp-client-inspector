/**
 * @module
 * Type definitions index for the MCP Client Inspector.
 *
 * This module re-exports all public type definitions used across the MCP Client Inspector.
 * Import types from this module when working with the inspector's public API.
 *
 * @example
 * ```typescript
 * import type { ServerOptions, RuntimeInfo } from './shared/types/index.ts';
 * ```
 */

// Common types and utilities
export * from './common.types.ts';

// Console WebSocket protocol types
export * from './console.types.ts';

// MCP protocol types
export * from './mcp.types.ts';

// Validation schemas
export * from './validation.ts';
