#!/usr/bin/env node
// src/index.js - yunxiao CLI entry point
import { Command } from "commander";
import chalk from "chalk";
import { createClient, getConfig } from "./api.js";
import { registerProjectCommands } from "./commands/project.js";
import { registerWorkitemCommands } from "./commands/workitem.js";

const program = new Command();

program
  .name("yunxiao")
  .description("CLI for Aliyun Yunxiao (云效) DevOps platform")
  .version("0.1.0");

// Global error handler
function withErrorHandling(fn) {
  return async (...args) => {
    try {
      await fn(...args);
    } catch (err) {
      if (err.response) {
        console.error(chalk.red("API Error:"), err.response.data?.errorMessage || err.response.statusText);
        console.error(chalk.gray(`Status: ${err.response.status}`));
      } else {
        console.error(chalk.red("Error:"), err.message);
      }
      process.exit(1);
    }
  };
}

const client = createClient();
const { orgId, projectId } = getConfig();

registerProjectCommands(program, client, orgId, withErrorHandling);
registerWorkitemCommands(program, client, orgId, projectId, withErrorHandling);

program.parse();
