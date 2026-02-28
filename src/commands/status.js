// src/commands/status.js - Workitem status management commands
import chalk from "chalk";
import { getWorkitemStatuses } from "../api.js";

function statusColor(name, color) {
  if (!name) return chalk.gray("-");
  if (color) {
    if (color.toLowerCase().includes("green") || color.toLowerCase().includes("success")) return chalk.green(name);
    if (color.toLowerCase().includes("red") || color.toLowerCase().includes("error")) return chalk.red(name);
    if (color.toLowerCase().includes("yellow") || color.toLowerCase().includes("warning")) return chalk.yellow(name);
    if (color.toLowerCase().includes("blue") || color.toLowerCase().includes("info")) return chalk.blue(name);
  }
  // Default color based on status name
  const n = (name || "").toLowerCase();
  if (n.includes("done") || n.includes("completed") || n.includes("close") || n.includes("finish") || n.includes("通过") || n.includes("完成")) return chalk.green(name);
  if (n.includes("progress") || n.includes("design") || n.includes("review") || n.includes("开发") || n.includes("测试")) return chalk.yellow(name);
  if (n.includes("cancel") || n.includes("reject") || n.includes("废弃")) return chalk.gray(name);
  if (n.includes("new") || n.includes("todo") || n.includes("待")) return chalk.blue(name);
  return chalk.white(name);
}

export function registerStatusCommands(program, client, orgId, defaultProjectId, withErrorHandling) {
  const status = program.command("status").description("List workitem statuses");

  status
    .command("list")
    .description("List available workitem statuses for a project")
    .option("-p, --project <id>", "Project ID (default: YUNXIAO_PROJECT_ID)")
    .option("-c, --category <type>", "Category: Req, Task, Bug", "Req")
    .action(withErrorHandling(async (opts) => {
      const spaceId = opts.project || defaultProjectId;
      if (!spaceId) {
        console.error(chalk.red("Error: project ID required (--project or YUNXIAO_PROJECT_ID)"));
        process.exit(1);
      }
      const statuses = await getWorkitemStatuses(client, orgId, spaceId, {
        category: opts.category,
      });
      if (!statuses || statuses.length === 0) {
        console.log(chalk.yellow("No statuses found for category: " + opts.category));
        return;
      }
      console.log(chalk.bold("\nAvailable statuses for " + opts.category + ":\n"));
      for (const status of statuses) {
        const name = statusColor(status.name || status.displayName, status.color);
        const id = chalk.gray(status.id);
        console.log("  " + name.padEnd(20) + " " + id);
      }
      console.log("\n" + chalk.gray("Use status ID with: yunxiao wi update <id> --status <statusId>"));
      console.log();
    }));
}
