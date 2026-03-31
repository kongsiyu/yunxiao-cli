// src/commands/sprint.js
import chalk from "chalk";
import { listSprints } from "../api.js";
import { printJson, printError } from "../output.js";

function formatDate(ts) {
  if (!ts) return "-";
  return new Date(ts).toISOString().split("T")[0];
}

function statusColor(status) {
  if (!status) return chalk.gray("-");
  const s = (status || "").toLowerCase();
  if (s === "active") return chalk.green(status);
  if (s === "future") return chalk.cyan(status);
  if (s === "closed") return chalk.gray(status);
  return chalk.white(status);
}

export function registerSprintCommands(program, client, orgId, defaultProjectId, withErrorHandling, jsonMode) {
  const sp = program.command("sprint").description("Manage sprints/iterations");

  sp
    .command("list")
    .description("List sprints")
    .option("-p, --project <id>", "Project ID (default: YUNXIAO_PROJECT_ID)")
    .option("-s, --status <status>", "Filter by status: active, future, closed")
    .option("--page <n>", "Page number", "1")
    .option("--limit <n>", "Per page", "20")
    .action(withErrorHandling(async (opts) => {
      const spaceId = opts.project || defaultProjectId;
      if (!spaceId) {
        printError("INVALID_ARGS", "project ID required (--project or YUNXIAO_PROJECT_ID)", jsonMode);
        process.exit(1);
      }
      const sprints = await listSprints(client, orgId, spaceId, {
        status: opts.status,
        page: parseInt(opts.page),
        perPage: parseInt(opts.limit),
      });
      if (jsonMode) {
        printJson({ sprints: sprints || [], total: (sprints || []).length });
        return;
      }
      if (!sprints || sprints.length === 0) {
        console.log(chalk.yellow("No sprints found"));
        return;
      }
      console.log(chalk.bold(`\nFound ${sprints.length} sprint(s):\n`));
      for (const s of sprints) {
        const id = chalk.cyan((s.id || "").toString().padEnd(10));
        const name = chalk.white((s.name || "-").padEnd(30));
        const status = statusColor(s.status);
        console.log(`${id} ${name} ${status}`);
        const start = formatDate(s.startDate || s.gmtStart);
        const end = formatDate(s.endDate || s.gmtEnd);
        console.log(`  ${chalk.gray("Period:")} ${start} ~ ${end}`);
      }
    }));

  sp
    .command("view <id>")
    .description("View sprint by ID (lists all sprints and filters by id)")
    .option("-p, --project <id>", "Project ID (default: YUNXIAO_PROJECT_ID)")
    .action(withErrorHandling(async (id, opts) => {
      const spaceId = opts.project || defaultProjectId;
      if (!spaceId) {
        printError("INVALID_ARGS", "project ID required (--project or YUNXIAO_PROJECT_ID)", jsonMode);
        process.exit(1);
      }
      // Fetch all sprints and find by id since getSprint API is not yet available
      const sprints = await listSprints(client, orgId, spaceId, { perPage: 100 });
      const sprint = (sprints || []).find(s => s.id === id || s.id === parseInt(id, 10));
      if (!sprint) {
        printError("NOT_FOUND", `Sprint ${id} not found`, jsonMode);
        process.exit(1);
      }

      if (jsonMode) {
        printJson(sprint);
        return;
      }

      console.log(chalk.bold("\nSprint Details:\n"));
      console.log(`  ${chalk.gray("ID:")}      ${sprint.id}`);
      console.log(`  ${chalk.gray("Name:")}    ${sprint.name || "-"}`);
      console.log(`  ${chalk.gray("Status:")}  ${statusColor(sprint.status)}`);
      const start = formatDate(sprint.startDate || sprint.gmtStart);
      const end = formatDate(sprint.endDate || sprint.gmtEnd);
      console.log(`  ${chalk.gray("Period:")}  ${start} ~ ${end}`);
      if (sprint.goal) {
        console.log(`  ${chalk.gray("Goal:")}    ${sprint.goal}`);
      }
    }));
}
