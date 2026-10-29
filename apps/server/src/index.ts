import { createApp } from "./app.js";
import { readConfiguration } from "./config.js";
import { SqliteStore } from "./sqlite-store.js";
import { SessionService } from "./session-service.js";
import { localQaBrowserOrigins } from "./local-browser-origins.js";

const configuration = readConfiguration(process.env);
const store = new SqliteStore(configuration.databasePath);
const server = createApp(
  new SessionService(store, configuration.publicOrigin),
  {
    additionalMutationOrigins: localQaBrowserOrigins(
      configuration.publicOrigin,
      process.env,
    ),
    legacyTools:
      process.env.NODE_ENV !== "production" &&
      process.env.LEGACY_STUDIO_ENABLED === "1",
  },
);
server.requestTimeout = 30_000;
server.headersTimeout = 15_000;

server.on("error", (error: NodeJS.ErrnoException) => {
  console.error(
    `Server startup failed (${error.code ?? "UNKNOWN"}). Check host and port.`,
  );
  process.exitCode = 1;
});

server.listen(configuration.port, configuration.host, () => {
  console.log(
    `Session server listening on ${configuration.host}:${configuration.port}`,
  );
});

function shutdown() {
  server.close(() => {
    store.close();
    process.exit(0);
  });
  // Close SSE connections too; an idle stream must not prevent clean shutdown.
  setTimeout(() => server.closeAllConnections(), 100).unref();
}
process.once("SIGTERM", shutdown);
process.once("SIGINT", shutdown);
