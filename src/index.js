#!/usr/bin/env node
// src/index.js - yunxiao CLI entry point
import { Command } from "commander";
import chalk from "chalk";
import { createClient, getConfig, getCurrentUser } from "./api.js";
import { registerProjectCommands } from "./commands/project.js";
import { registerWorkitemCommands } from "./commands/workitem.js";

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

const client = createClient();
const { orgId, projectId } = getConfig();

// 自动获取当前用户 ID（如果 YUNXIAO_USER_ID 未设置则从 API 获取）
let currentUserId = process.env.YUNXIAO_USER_ID || null;

async function initCurrentUser() {
  if (!currentUserId) {
    try {
      const user = await getCurrentUser(client);
      currentUserId = user.id;
    } catch (e) {
      // 获取失败不影响其他功能，create 时再报错
    }
  }
}

await initCurrentUser();

registerProjectCommands(program, client, orgId, withErrorHandling);
registerWorkitemCommands(program, client, orgId, projectId, withErrorHandling, currentUserId);

program.parse();
