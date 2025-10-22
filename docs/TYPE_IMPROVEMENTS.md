# Type System Improvements

**Date**: 2025-10-22
**Status**: Complete ✅

## Summary

Standardized type usage across the inspector project and enhanced bb-mcp-server library with better type exports.

## Changes to bb-mcp-server Library

### 1. Exported InferZodSchema ✅

**Before**: Private type helper  
**After**: Public exported type

```typescript
// src/lib/types/BeyondMcpTypes.ts
export type InferZodSchema<T extends Record<string, ZodSchema>> = {
  [K in keyof T]: T[K] extends ZodSchema<infer U> ? U : never;
};
```

**Benefits**:
- Consumers can properly type their tool arguments
- No need to duplicate this utility type
- Better TypeScript inference for tool handlers

### 2. Added ToolDependencies Interface ✅

**New export** for standardized dependency injection:

```typescript
// src/lib/types/BeyondMcpTypes.ts
export interface ToolDependencies {
  logger: Logger;
  configManager?: ConfigManager;
  auditLogger?: AuditLogger;
  errorHandler?: ErrorHandler;
  kvManager?: KVManager;
  [key: string]: any; // Allow custom dependencies for extensibility
}
```

**Benefits**:
- Standardizes tool module dependency patterns
- Type-safe access to core components
- Documents expected dependencies
- Extensible for custom needs

## Changes to Inspector Project

### Updated All Tool Files (6 files)

**Before**:
```typescript
import type { ToolConfig } from '@beyondbetter/bb-mcp-server';

export function getTools(dependencies: any): ToolConfig<any>[] {
  const { logger } = dependencies;
  // ...
}
```

**After**:
```typescript
import type { ToolRegistration, ToolDependencies } from '@beyondbetter/bb-mcp-server';

export function getTools(dependencies: ToolDependencies): ToolRegistration[] {
  const { logger } = dependencies;
  // ...
}
```

**Files Updated**:
1. `src/plugins/inspector.plugin/tools/echo.ts`
2. `src/plugins/inspector.plugin/tools/convertDate.ts`
3. `src/plugins/inspector.plugin/tools/calculate.ts`
4. `src/plugins/inspector.plugin/tools/delayResponse.ts`
5. `src/plugins/inspector.plugin/tools/randomData.ts`
6. `src/plugins/inspector.plugin/tools/triggerError.ts`

## Type Consolidation

### Before (Duplication Issue)

**bb-mcp-applescript** had its own types:
- `ToolConfig<T>` - Duplicate of library's `ToolRegistration`
- `ToolDependencies` - Useful pattern not in library
- `InferZodSchema<T>` - Re-exported from unexported library type

**bb-mcp-server** had:
- ✅ `ToolRegistration` - Proper type
- ❌ `InferZodSchema<T>` - Not exported (private)
- ❌ `ToolDependencies` - Didn't exist

### After (Standardized)

**bb-mcp-server** now exports:
- ✅ `ToolRegistration` - Tool registration structure
- ✅ `ToolDependencies` - Standard dependency injection
- ✅ `InferZodSchema<T>` - Type inference utility
- ✅ `ToolDefinition<T>` - Tool definition structure
- ✅ `ToolHandler<T>` - Tool handler type
- ✅ `ToolRegistrationOptions` - Registration options

**All consumers** can now use standard library types without duplication.

## Benefits

### For Library (bb-mcp-server)
1. **Better API**: More complete type exports
2. **Developer Experience**: Clear, documented types
3. **Consistency**: Standard patterns across ecosystem
4. **Extensibility**: ToolDependencies allows custom deps

### For Consumers (Inspector, bb-mcp-applescript)
1. **No Duplication**: Use library types directly
2. **Type Safety**: Proper TypeScript inference
3. **Maintainability**: Changes in one place
4. **Documentation**: Types self-document expected structure

## Type Usage Examples

### Tool Module Pattern

```typescript
import { z } from 'zod';
import type { 
  ToolRegistration, 
  ToolDependencies,
  InferZodSchema 
} from '@beyondbetter/bb-mcp-server';

// Define input schema
const myToolInputSchema = {
  message: z.string().describe('Input message'),
  count: z.number().int().min(1).optional(),
} as const;

// Infer types from schema
type MyToolArgs = InferZodSchema<typeof myToolInputSchema>;
// Result: { message: string; count?: number }

// Tool module function
export function getTools(dependencies: ToolDependencies): ToolRegistration[] {
  const { logger, configManager } = dependencies;

  return [
    {
      name: 'my_tool',
      definition: {
        title: 'My Tool',
        description: 'Does something useful',
        category: 'Utility',
        inputSchema: myToolInputSchema,
      },
      handler: async (args: MyToolArgs) => {
        // args is properly typed!
        logger.info('Tool called', { message: args.message });
        return {
          content: [{ type: 'text', text: args.message }],
        };
      },
    },
  ];
}
```

### Plugin Pattern

```typescript
import type { AppPlugin } from '@beyondbetter/bb-mcp-server';
import { getTools as getMyTools } from './tools/myTool.ts';

export default {
  name: 'my-plugin',
  version: '1.0.0',
  description: 'My custom plugin',

  async initialize(dependencies, toolRegistry, workflowRegistry) {
    const { logger } = dependencies;

    // Get tools with proper typing
    const tools = getMyTools(dependencies);

    // Register all tools
    for (const tool of tools) {
      toolRegistry.registerTool(
        tool.name,
        tool.definition,
        tool.handler,
        tool.options,
      );
    }

    logger.info('Plugin initialized', { toolCount: tools.length });
  },
} as AppPlugin;
```

## Migration Guide

### For Existing Projects

If you have code using `ToolConfig` or custom dependency types:

1. **Update imports**:
   ```typescript
   // Before
   import type { ToolConfig } from './types/toolTypes.ts';
   
   // After
   import type { ToolRegistration, ToolDependencies } from '@beyondbetter/bb-mcp-server';
   ```

2. **Update function signatures**:
   ```typescript
   // Before
   export function getTools(dependencies: any): ToolConfig<any>[] {
   
   // After
   export function getTools(dependencies: ToolDependencies): ToolRegistration[] {
   ```

3. **Remove custom type definitions** that duplicate library types

4. **Update plugin initialization** to pass ToolDependencies

## Testing

### Type Checking
```bash
# Inspector project
cd mcp-server
deno task check

# Should pass with no type errors
```

### Runtime Verification
```bash
# Start server
MCP_TRANSPORT=http deno task dev

# Verify tools load correctly
# Check logs for "Inspector plugin initialized"
```

## Documentation Updates

### Updated Files
- ✅ `bb-mcp-server:src/lib/types/BeyondMcpTypes.ts` - Added exports
- ✅ All inspector tool files - Use library types
- ✅ This document - Migration guide

### Recommended for bb-mcp-applescript
Update `server/src/types/toolTypes.ts` to remove duplicates:

```typescript
// Simplified version - just re-exports
import type {
  ToolRegistration,
  ToolDependencies,
  ToolDefinition,
  ToolHandler,
  ToolRegistrationOptions,
  ToolCallExtra,
  InferZodSchema,
} from '@beyondbetter/bb-mcp-server';

export type {
  ToolRegistration,
  ToolDependencies,
  ToolDefinition,
  ToolHandler,
  ToolRegistrationOptions,
  ToolCallExtra,
  InferZodSchema,
};
```

## Impact

### Breaking Changes
- ❌ None - These are additions to the library
- ✅ Backward compatible - existing code still works

### Migration Required
- Only if you want to adopt the new types
- Gradual migration possible
- Old patterns still work

## Future Improvements

### Potential Additions
1. **ToolContext** - Execution context type
2. **ToolMetadata** - Enhanced metadata structure
3. **ToolValidation** - Validation result types
4. **ToolRegistry types** - Registry-specific types

### Documentation
- Add examples to library docs
- Update plugin development guide
- Create type reference guide

## Conclusion

The type system is now more complete and consistent:
- ✅ Library exports all needed types
- ✅ No duplication across projects
- ✅ Better developer experience
- ✅ Proper TypeScript inference
- ✅ Extensible for custom needs

**Status**: Complete and production-ready ✅

---

**Implemented by**: AI Brain (LLM)  
**Date**: 2025-10-22  
**Library Version**: bb-mcp-server 1.0.0+
