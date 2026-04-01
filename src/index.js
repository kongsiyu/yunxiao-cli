#!/usr/bin/env node
// src/index.js - yunxiao CLI entry point
import { Command } from "commander";
import chalk from "chalk";
import { getCurrentUser, createClientWithPat } from "./api.js";
import { loadConfig } from "./config.js";
import { AppError, ERROR_CODE } from "./errors.js";
import { printError } from "./output.js";
import { registerProjectCommands } from "./commands/project.js";
import { registerWorkitemCommands } from "./commands/workitem.js";
import { registerAuthCommands } from "./commands/auth.js";
import { registerSprintCommands } from "./commands/sprint.js";
import { registerStatusCommands } from "./commands/status.js";

const program = new Command();

// Detect --json mode before parse so withErrorHandling and command handlers can use it
const jsonMode = process.argv.includes('--json');

program
  .name("yunxiao")
  .description("CLI for Aliyun Yunxiao (云效) DevOps platform")
  .version("0.1.1")
  .option("--json", "Output results as JSON (pure JSON to stdout, no chalk)");

function withErrorHandling(fn) {
  return async (...args) => {
    try {
      await fn(...args);
    } catch (err) {
      if (err instanceof AppError) {
        printError(err.code, err.message, jsonMode);
      } else if (err.response) {
        printError(ERROR_CODE.API_ERROR, err.response.data?.errorMessage || err.response.statusText, jsonMode);
      } else {
        printError(ERROR_CODE.API_ERROR, err.message, jsonMode);
      }
      process.exit(1);
    }
  };
}

// Register auth commands first (they don't require a client)
registerAuthCommands(program);

// Load config with correct priority: file > env vars (CLI args handled per-command)
const config = loadConfig();
const token = config.token;

let client = null;
let currentUserId = config.userId;
let currentUser = null;
let orgId = config.orgId;
let projectId = config.projectId;

// Create client if token is available
if (token) {
  client = createClientWithPat(token);

  async function initCurrentUser() {
    if (!currentUserId && client) {
      try {
        currentUser = await getCurrentUser(client);
        currentUserId = currentUser.id;
      } catch (e) {
        // 获取失败不影响其他功能
      }
    }
  }
  await initCurrentUser();
}

// whoami 命令
program
  .command("whoami")
  .description("Show current authenticated user")
  .action(withErrorHandling(async () => {
    if (!client) {
      console.log(chalk.yellow("Not authenticated. Run: yunxiao auth login"));
      return;
    }
    const user = currentUser || await getCurrentUser(client);
    console.log(chalk.bold("\nCurrent user:\n"));
    console.log("  " + chalk.gray("ID:      ") + user.id);
    console.log("  " + chalk.gray("Name:    ") + (user.name || "-"));
    console.log("  " + chalk.gray("Email:   ") + (user.email || "-"));
    console.log("  " + chalk.gray("Org:     ") + (user.lastOrganization || "-"));
    console.log("  " + chalk.gray("Created: ") + (user.createdAt ? user.createdAt.split("T")[0] : "-"));
    console.log();
  }));

if (client && orgId) {
  registerProjectCommands(program, client, orgId, withErrorHandling, jsonMode);
  registerWorkitemCommands(program, client, orgId, projectId, withErrorHandling, currentUserId, jsonMode);
  registerSprintCommands(program, client, orgId, projectId, withErrorHandling, jsonMode);
  registerStatusCommands(program, client, orgId, projectId, withErrorHandling, jsonMode);
} else {
  const authRequiredAction = withErrorHandling(async () => {
    throw new AppError(ERROR_CODE.AUTH_MISSING, 'Authentication required. Run: yunxiao auth login');
  });
  const authRequiredCommands = [
    { name: 'project', desc: 'Manage projects (requires auth)' },
    { name: 'workitem', desc: 'Manage workitems (requires auth)' },
    { name: 'sprint', desc: 'Manage sprints (requires auth)' },
    { name: 'status', desc: 'Query workflow statuses (requires auth)' },
  ];
  for (const { name, desc } of authRequiredCommands) {
    program
      .command(`${name} [args...]`)
      .allowUnknownOption(true)
      .description(desc)
      .action(authRequiredAction);
  }
}

program.parse();
