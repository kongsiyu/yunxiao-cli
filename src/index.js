#!/usr/bin/env node
// src/index.js - yunxiao CLI entry point
import { Command } from "commander";
import { createClientWithPat } from "./api.js";
import { loadConfig } from "./config.js";
import { printError } from "./output.js";
import { checkVersionAsync, getPackageVersion } from "./version-check.js";
import { initI18n } from "./i18n/index.js";
import { registerProjectCommands } from "./commands/project.js";
import { registerWorkitemCommands } from "./commands/workitem.js";
import { registerAuthCommands } from "./commands/auth.js";
import { registerWhoamiCommand } from "./commands/whoami.js";
import { registerSprintCommands } from "./commands/sprint.js";
import { registerPipelineCommands } from "./commands/pipeline.js";
import { registerStatusCommands } from "./commands/status.js";
import { registerQueryCommands } from "./commands/query.js";
import { createCodeupClient } from "./codeup-api.js";
import { registerRepoCommands } from "./commands/repo.js";

const program = new Command();

// Detect --json mode before parse so withErrorHandling and command handlers can use it
const jsonMode = process.argv.includes('--json');

// Load config and initialize i18n
const config = loadConfig();
initI18n(config.language);

program
  .name("yunxiao")
  .description("CLI for Aliyun Yunxiao (云效) DevOps platform")
  .version(getPackageVersion() || "0.0.0")
  .option("--json", "Output results as JSON (pure JSON to stdout, no chalk)");

function withErrorHandling(fn) {
  return async (...args) => {
    try {
      await fn(...args);
    } catch (err) {
      if (err instanceof AppError) {
        printError(err.code, err.message, jsonMode);
      } else if (err.response?.status === 401 || err.response?.status === 403) {
        printError(ERROR_CODE.AUTH_FAILED, 'Authentication failed or token expired. Run: yunxiao auth login', jsonMode);
      } else if (err.response) {
        const code = err.response.status === 404 ? ERROR_CODE.NOT_FOUND : ERROR_CODE.API_ERROR;
        printError(code, err.response.data?.errorMessage || err.response.statusText, jsonMode);
      } else {
        printError(ERROR_CODE.API_ERROR, err.message, jsonMode);
      }
      process.exit(1);
    }
  };
}

// Register auth commands first (they don't require a client)
registerAuthCommands(program);

const token = config.token;

let client = null;
let codeupClient = null;
let currentUserId = config.userId;
let orgId = config.orgId;
let projectId = config.projectId;

// Create client if token is available
if (token) {
  client = createClientWithPat(token);
  codeupClient = createCodeupClient(token);
}

registerWhoamiCommand(program, client, withErrorHandling);

// Always register all commands (auth is checked per-command at runtime)
registerProjectCommands(program, client, orgId, withErrorHandling, jsonMode);
registerWorkitemCommands(program, client, orgId, projectId, withErrorHandling, currentUserId, jsonMode);
registerSprintCommands(program, client, orgId, projectId, withErrorHandling, jsonMode);
registerPipelineCommands(program, client, orgId, withErrorHandling, jsonMode);
registerStatusCommands(program, client, orgId, projectId, withErrorHandling, jsonMode);
registerQueryCommands(program, client, orgId, projectId, withErrorHandling, jsonMode);
registerRepoCommands(program, codeupClient, withErrorHandling, jsonMode);

// Check for version updates (non-blocking, async)
checkVersionAsync().then(({ hasUpdate, latestVersion }) => {
  if (hasUpdate && latestVersion) {
    process.stderr.write(`yunxiao v${latestVersion} available, run \`npm update -g @kongsiyu/yunxiao-cli\` to update\n`);
  }
}).catch(() => {
  // Silently ignore any errors in version check
});

program.parse();
