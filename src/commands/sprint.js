// src/commands/sprint.js - Sprint/Iteration management commands
import chalk from "chalk";
import { listSprints, searchWorkitemsBySprint } from "../api.js";

function formatDate(ts) {
  if (!ts) return "-";
  return new Date(ts).toISOString().split("T")[0];
}

function statusColor(name) {
  if (!name) return chalk.gray("-");
  const n = (name || "").toLowerCase();
  if (n.includes("active") || n.includes("进行中")) return chalk.green(name);
  if (n.includes("future") || n.includes("未开始")) return chalk.blue(name);
  if (n.includes("close") || n.includes("完成")) return chalk.gray(name);
  return chalk.yellow(name);
}

export function registerSprintCommands(program, client, orgId, defaultProjectId, withErrorHandling) {
  const sprint = program.command("sprint").description("Manage sprints/iterations");

  sprint
    .command("list")
    .description("List sprints/iterations")
    .option("-p, --project <id>", "Project ID (default: YUNXIAO_PROJECT_ID)")
    .option("-s, --status <status>", "Filter by status: active, future, closed")
    .option("--page <n>", "Page number", "1")
    .option("--limit <n>", "Per page", "20")
    .action(withErrorHandling(async (opts) => {
      const spaceId = opts.project || defaultProjectId;
      if (!spaceId) {
        console.error(chalk.red("Error: project ID required (--project or YUNXIAO_PROJECT_ID)"));
        process.exit(1);
      }
      const sprints = await listSprints(client, orgId, spaceId, {
        status: opts.status,
        page: parseInt(opts.page),
        perPage: parseInt(opts.limit),
      });
      if (!sprints || sprints.length === 0) {
        console.log(chalk.yellow("No sprints found"));
        return;
      }
      console.log(chalk.bold("\nFound " + sprints.length + " sprint(s):\n"));
      for (const sprint of sprints) {
        const name = chalk.cyan((sprint.name || sprint.id).padEnd(20));
        const id = chalk.gray(sprint.id);
        const status = statusColor(sprint.status?.displayName || sprint.status?.name || sprint.status);
        const dates = formatDate(sprint.startDate) + " → " + formatDate(sprint.endDate);
        console.log(name + " " + status);
        console.log("  " + chalk.gray("ID:       ") + id);
        console.log("  " + chalk.gray("Duration: ") + dates);
      }
      console.log();
    }));

  sprint
    .command("view <id>")
    .description("View work items in a sprint (use sprint ID from list)")
    .option("-p, --project <id>", "Project ID (default: YUNXIAO_PROJECT_ID)")
    .option("-c, --category <type>", "Category: Req, Task, Bug", "Req")
    .action(withErrorHandling(async (id, opts) => {
      const spaceId = opts.project || defaultProjectId;
      if (!spaceId) {
        console.error(chalk.red("Error: project ID required (--project or YUNXIAO_PROJECT_ID)"));
        process.exit(1);
      }
      // List workitems in this sprint
      console.log(chalk.bold("\nWork Items in Sprint:\n"));
      const items = await searchWorkitemsBySprint(client, orgId, spaceId, id, { category: opts.category });
      if (!items || items.length === 0) {
        console.log(chalk.yellow("No work items in this sprint"));
        return;
      }
      console.log(chalk.bold("Found " + items.length + " work item(s):\n"));
      for (const item of items) {
        const sn = chalk.cyan((item.serialNumber || item.id.slice(0, 8)).padEnd(10));
        const status = statusColor(item.status?.displayName || item.status?.name);
        console.log(sn + " " + chalk.white(item.subject));
        console.log("  " + chalk.gray("Status:") + " " + status + "  " + chalk.gray("Assignee:") + " " + (item.assignedTo?.name || "-"));
      }
    }));
}
