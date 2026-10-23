import { createApp } from "./app.js";
import { readConfiguration } from "./config.js";

const configuration = readConfiguration(process.env);
const server = createApp();

server.on("error", (error: NodeJS.ErrnoException) => {
  console.error(
    `Server startup failed (${error.code ?? "UNKNOWN"}). Check host and port.`,
  );
  process.exitCode = 1;
});

server.listen(configuration.port, configuration.host, () => {
  console.log(
    `Foundation server listening on ${configuration.host}:${configuration.port}`,
  );
});

function shutdown() {
  server.close(() => process.exit(0));
  // Close SSE connections too; an idle stream must not prevent clean shutdown.
  setTimeout(() => server.closeAllConnections(), 100).unref();
}
process.once("SIGTERM", shutdown);
process.once("SIGINT", shutdown);
