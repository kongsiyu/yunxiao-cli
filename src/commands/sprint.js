// src/commands/sprint.js
import chalk from "chalk";
import { listSprints, getSprintInfo, searchWorkitems } from "../api.js";
import { printJson, printError } from "../output.js";
import { AppError, ERROR_CODE } from "../errors.js";

function formatDate(ts) {
  if (!ts) return "-";
  return new Date(ts).toISOString().split("T")[0];
}

function statusColor(status) {
  if (!status) return chalk.gray("-");
  const s = (status || "").toUpperCase();
  if (s === "DOING") return chalk.green(status);
  if (s === "TODO") return chalk.cyan(status);
  if (s === "ARCHIVED") return chalk.gray(status);
  return chalk.white(status);
}

export function isSprintWorkitemDone(status) {
  if (!status || typeof status !== 'object') return false;

  // Priority 1: explicit boolean done field from API is the most reliable.
  if (typeof status.done === 'boolean') return status.done;
  // Priority 2: stage enum is a stable workflow marker (DONE/DOING/UNSTARTED).
  if (typeof status.stage === 'string') return status.stage.toUpperCase() === 'DONE';
  // Priority 3: exact English status name fallback; avoid fuzzy matching.
  if (typeof status.nameEn === 'string') return status.nameEn.trim().toLowerCase() === 'done';

  return false;
}

export function registerSprintCommands(program, client, orgId, defaultProjectId, withErrorHandling, jsonMode) {
  const sp = program.command("sprint").description("Manage sprints/iterations");

  sp
    .command("list")
    .description("List sprints")
    .option("-p, --project <id>", "Project ID (default: YUNXIAO_PROJECT_ID)")
    .option("-s, --status <status>", "Filter by status: TODO, DOING, ARCHIVED")
    .option("--page <n>", "Page number", "1")
    .option("--limit <n>", "Per page", "20")
    .action(withErrorHandling(async (opts) => {
      if (!client || !orgId) throw new AppError(ERROR_CODE.AUTH_MISSING, 'Authentication required. Run: yunxiao auth login');
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
    .description("View sprint details including workitem completion statistics")
    .option("-p, --project <id>", "Project ID (default: YUNXIAO_PROJECT_ID)")
    .action(withErrorHandling(async (id, opts) => {
      if (!client || !orgId) throw new AppError(ERROR_CODE.AUTH_MISSING, 'Authentication required. Run: yunxiao auth login');
      const spaceId = opts.project || defaultProjectId;
      if (!spaceId) {
        printError("INVALID_ARGS", "project ID required (--project or YUNXIAO_PROJECT_ID)", jsonMode);
        process.exit(1);
      }

      // Both API calls must succeed; any failure propagates to withErrorHandling
      const sprint = await getSprintInfo(client, orgId, spaceId, id);
      const { items = [] } = await searchWorkitems(client, orgId, spaceId, {
        sprint: id,
        category: "Req,Task,Bug",
        perPage: 100,
      });

      const total = items.length;

      // Determine done by confirmed API schema priority: done(boolean) > stage(enum) > nameEn(exact)
      const done = items.filter(item => {
        return isSprintWorkitemDone(item.status);
      }).length;

      // Count by workitemType.name (API returns name, not category)
      const byCategory = {};
      for (const item of items) {
        const cat = item.workitemType?.name || item.category || 'Unknown';
        byCategory[cat] = (byCategory[cat] || 0) + 1;
      }

      // Note: perPage is capped at 100; flag if result may be truncated
      const truncated = items.length === 100;
      const stats = { total, done, byCategory, ...(truncated ? { note: 'showing first 100 items' } : {}) };

      if (jsonMode) {
        printJson({ sprint, stats });
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

      console.log(chalk.bold("\nWorkitem Statistics:\n"));
      if (truncated) {
        console.log(chalk.yellow("  (showing first 100 items; sprint may have more)"));
      }
      console.log(`  ${chalk.gray("Total:")}     ${total}`);
      console.log(`  ${chalk.gray("Done:")}      ${chalk.green(done)} / ${total}`);
      if (Object.keys(byCategory).length > 0) {
        console.log(`  ${chalk.gray("By Type:")}`);
        for (const [cat, count] of Object.entries(byCategory)) {
          console.log(`    ${chalk.cyan(cat.padEnd(10))} ${count}`);
        }
      }
    }));
}
