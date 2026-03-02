// src/commands/sprint.js
import chalk from "chalk";
import { listSprints, getSprint, listSprintWorkitems } from "../api.js";

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

export function registerSprintCommands(program, client, orgId, defaultProjectId, withErrorHandling) {
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
    .description("View sprint details and work items")
    .option("-p, --project <id>", "Project ID (default: YUNXIAO_PROJECT_ID)")
    .action(withErrorHandling(async (id, opts) => {
      const spaceId = opts.project || defaultProjectId;
      const sprint = await getSprint(client, orgId, id);
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

      // Fetch work items in this sprint
      const projectId = spaceId || sprint.spaceId;
      if (!projectId) {
        console.log(chalk.yellow("\nNo project ID available to fetch work items."));
        return;
      }
      let workitems;
      try {
        workitems = await listSprintWorkitems(client, orgId, id);
      } catch {
        // Some API versions may not support this endpoint
        workitems = null;
      }
      if (!workitems || workitems.length === 0) {
        console.log(chalk.gray("\nNo work items in this sprint."));
        return;
      }
      console.log(chalk.bold(`\nWork Items (${workitems.length}):\n`));
      for (const item of workitems) {
        const sn = chalk.cyan((item.serialNumber || item.id?.slice(0, 8) || "-").padEnd(10));
        const statusName = item.status?.displayName || item.status?.name || "-";
        console.log(`${sn} ${chalk.white(item.subject || "-")}`);
        console.log(`  ${chalk.gray("Status:")} ${statusName}  ${chalk.gray("Assignee:")} ${item.assignedTo?.name || "-"}`);
      }
    }));
}
