import { z } from "zod";

const configurationSchema = z.object({
  SERVER_HOST: z.string().min(1).default("127.0.0.1"),
  SERVER_PORT: z.coerce.number().int().min(1).max(65535).default(4000),
});

export function readConfiguration(environment: NodeJS.ProcessEnv) {
  const configuration = configurationSchema.parse(environment);
  return { host: configuration.SERVER_HOST, port: configuration.SERVER_PORT };
}
