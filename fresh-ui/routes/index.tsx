import { Head } from "fresh/runtime";
import { define } from "../utils.ts";
import Console from "../islands/Console.tsx";

export default define.page(function Home() {
  const wsUrl = Deno.env.get("MCP_SERVER_WS_URL") ||
    "ws://localhost:3030/ws/console";
  //console.log(`[RouteIndex] Connecting to ${wsUrl}...`);

  return (
    <>
      <Head>
        <title>MCP Client Inspector</title>
        <meta
          name="description"
          content="Test and inspect MCP client implementations"
        />
      </Head>
      <Console wsUrl={wsUrl} />
    </>
  );
});
