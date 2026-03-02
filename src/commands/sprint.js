// src/commands/sprint.js - Sprint/Iteration management commands
import chalk from "chalk";
import { listSprints } from "../api.js";

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
        const status = statusColor(sprint.status?.displayName || sprint.status?.name || sprint.status);
        const dates = formatDate(sprint.startDate) + " → " + formatDate(sprint.endDate);
        console.log(name + " " + status);
        console.log("  " + chalk.gray("Duration:") + " " + dates);
        if (sprint.completedCount !== undefined) {
          console.log("  " + chalk.gray("Progress:") + " " + sprint.completedCount + "/" + (sprint.issueCount || sprint.totalCount || "-"));
        }
      }
      console.log();
    }));

  sprint
    .command("view <id>")
    .description("View sprint details")
    .option("-p, --project <id>", "Project ID")
    .action(withErrorHandling(async (id, opts) => {
      // Note: Need to implement getSprint API if detailed view is needed
      console.log(chalk.yellow("Sprint view not yet implemented. Use 'sprint list' to see all sprints."));
      console.log(chalk.gray("Sprint ID: " + id));
    }));
}
