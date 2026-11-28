// Operator-only provisioning helper: use the installed Better Auth implementation, not custom crypto.
import { createRequire } from "node:module";
import { dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const sdk = require.resolve("@neon/auth", { paths: [fileURLToPath(new URL("../frontend/", import.meta.url))] });
const cryptoPath = require.resolve("better-auth/crypto", { paths: [dirname(sdk)] });
const { hashPassword, verifyPassword } = await import(pathToFileURL(cryptoPath).href);
let input = "";
for await (const chunk of process.stdin) input += chunk;
const { password, count } = JSON.parse(input);
if (typeof password !== "string" || password.length < 8 || password.length > 128 || !Number.isInteger(count) || count < 1 || count > 20) throw new Error("Invalid provisioning input");
const hashes = [];
for (let index = 0; index < count; index++) {
  const hash = await hashPassword(password);
  if (!await verifyPassword({ hash, password })) throw new Error("Password hash verification failed");
  hashes.push(hash);
}
process.stdout.write(JSON.stringify(hashes));
