/**
 * @module
 * Fresh UI application for the MCP Client Inspector.
 *
 * This module exports the Fresh application instance that provides the web-based
 * user interface for testing and monitoring MCP client interactions.
 */

import { App, staticFiles } from 'fresh';
import { define, type State } from './utils.ts';

/**
 * Fresh application instance for the MCP Client Inspector UI.
 *
 * This is the main Fresh app that handles routing, middleware, and serves
 * the web-based console for testing MCP clients. It includes static file serving,
 * shared state management, and file-system based routing.
 *
 * @example
 * ```typescript
 * import { app } from '@beyondbetter/bb-mcp-client-inspector/fresh-ui';
 * await app.listen({ port: 8000 });
 * ```
 */
export const app: App<State> = new App<State>();

app.use(staticFiles());

// Pass a shared value from a middleware
app.use(async (ctx) => {
  ctx.state.shared = 'hello';
  return await ctx.next();
});

// this is the same as the /api/:name route defined via a file. feel free to delete this!
app.get('/api2/:name', (ctx) => {
  const name = ctx.params.name;
  return new Response(
    `Hello, ${name.charAt(0).toUpperCase() + name.slice(1)}!`,
  );
});

// this can also be defined via a file. feel free to delete this!
const exampleLoggerMiddleware = define.middleware((ctx) => {
  console.log(`${ctx.req.method} ${ctx.req.url}`);
  return ctx.next();
});
app.use(exampleLoggerMiddleware);

// Include file-system based routes here
app.fsRoutes();
