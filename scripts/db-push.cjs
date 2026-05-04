/* eslint-disable @typescript-eslint/no-require-imports */
const { config } = require("dotenv");
const { spawn } = require("node:child_process");
const path = require("node:path");

config({ path: path.resolve(process.cwd(), ".env.local") });

const url = process.env.DATABASE_URL?.trim();
if (!url) {
  console.error(
    "Missing DATABASE_URL in .env.local.\n" +
      "Get the URI from Supabase → Project Settings → Database → Connection string\n" +
      "(Session pooler or Direct). URL-encode special characters in the password.",
  );
  process.exit(1);
}

const child = spawn(
  "npx",
  ["supabase", "db", "push", "--db-url", url, "--yes"],
  { stdio: "inherit", shell: true, cwd: path.resolve(process.cwd()) },
);

child.on("exit", (code) => process.exit(code ?? 1));
