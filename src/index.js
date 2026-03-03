#!/usr/bin/env node
// src/index.js - yunxiao CLI entry point
import { Command } from "commander";
import chalk from "chalk";
import { getCurrentUser, loadSavedConfig, createClientWithPat } from "./api.js";
import { registerProjectCommands } from "./commands/project.js";
import { registerWorkitemCommands } from "./commands/workitem.js";
import { registerAuthCommands } from "./commands/auth.js";
import { registerAttachmentCommands } from "./commands/attachment.js";

const program = new Command();

program
  .name("yunxiao")
  .description("CLI for Aliyun Yunxiao (云效) DevOps platform")
  .version("0.1.1");

function withErrorHandling(fn) {
  return async (...args) => {
    try {
      await fn(...args);
    } catch (err) {
      if (err.response) {
        console.error(chalk.red("API Error:"), err.response.data?.errorMessage || err.response.statusText);
        console.error(chalk.gray("Status: " + err.response.status));
      } else {
        console.error(chalk.red("Error:"), err.message);
      }
      process.exit(1);
    }
  };
}

// Register auth commands first (they don't require a client)
registerAuthCommands(program);

// Try to load config from file or environment
const savedConfig = loadSavedConfig();
const pat = process.env.YUNXIAO_PAT || (savedConfig?.pat);

let client = null;
let currentUserId = process.env.YUNXIAO_USER_ID || (savedConfig?.userId);
let currentUser = null;
let orgId = process.env.YUNXIAO_ORG_ID || (savedConfig?.orgId);
let projectId = process.env.YUNXIAO_PROJECT_ID || (savedConfig?.projectId);

// Create client if PAT is available
if (pat) {
  client = createClientWithPat(pat);
  
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
  registerProjectCommands(program, client, orgId, withErrorHandling);
  registerWorkitemCommands(program, client, orgId, projectId, withErrorHandling, currentUserId);
  registerAttachmentCommands(program, client, orgId, withErrorHandling);
}

program.parse();
