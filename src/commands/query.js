// src/commands/query.js - Saved search queries management
import chalk from "chalk";
import { getQuery, setQuery, deleteQuery, listQueries } from "./storage.js";
import { searchWorkitems } from "../api.js";

function formatDate(ts) {
  if (!ts) return "-";
  return new Date(ts).toISOString().split("T")[0];
}

function statusColor(name) {
  if (!name) return chalk.gray("-");
  const n = (name || "").toLowerCase();
  if (n.includes("done") || n.includes("completed") || n.includes("close") || n.includes("finish")) return chalk.green(name);
  if (n.includes("progress") || n.includes("design") || n.includes("review")) return chalk.yellow(name);
  if (n.includes("cancel") || n.includes("reject")) return chalk.gray(name);
  return chalk.blue(name);
}

function printItems(items) {
  for (const item of items) {
    const sn = chalk.cyan((item.serialNumber || item.id.slice(0, 8)).padEnd(10));
    const status = statusColor(item.status?.displayName || item.status?.name);
    console.log(sn + " " + chalk.white(item.subject));
    console.log("  " + chalk.gray("Status:") + " " + status + "  " + chalk.gray("Assignee:") + " " + (item.assignedTo?.name || "-") + "  " + chalk.gray("Created:") + " " + formatDate(item.gmtCreate));
  }
}

export function registerQueryCommands(program, client, orgId, defaultProjectId, withErrorHandling) {
  const q = program.command("query").alias("q").description("Manage saved search queries");

  q
    .command("save <name>")
    .description("Save a search query with filters")
    .option("-p, --project <id>", "Project ID")
    .option("-c, --category <type>", "Category: Req, Task, Bug", "Req")
    .option("-s, --status <id>", "Filter by status ID")
    .option("-a, --assigned-to <userId>", "Filter by assignee user ID")
    .option("--sprint <id>", "Filter by sprint/iteration ID")
    .option("--priority <level>", "Filter by priority")
    .option("--label <name>", "Filter by label")
    .option("--created-after <date>", "Filter items created after date (YYYY-MM-DD)")
    .option("--created-before <date>", "Filter items created before date (YYYY-MM-DD)")
    .option("-q, --query <keyword>", "Search by subject keyword")
    .option("--sort <field>", "Sort field: gmtCreate, gmtModified, subject", "gmtCreate")
    .option("--asc", "Sort ascending (default: desc)")
    .option("--limit <n>", "Default results per page", "20")
    .action(withErrorHandling(async (name, opts) => {
      const filters = {
        project: opts.project || defaultProjectId,
        category: opts.category,
        status: opts.status,
        assignedTo: opts.assignedTo,
        sprint: opts.sprint,
        priority: opts.priority,
        label: opts.label,
        createdAfter: opts.createdAfter,
        createdBefore: opts.createdBefore,
        query: opts.query,
        sort: opts.sort,
        asc: opts.asc || false,
        limit: opts.limit,
      };
      // Remove undefined/false values
      Object.keys(filters).forEach(k => {
        if (filters[k] === undefined || filters[k] === null || filters[k] === false) delete filters[k];
      });
      setQuery(name, filters);
      console.log(chalk.green(`\n✓ Query "${name}" saved!\n`));
      const active = Object.entries(filters).filter(([k]) => k !== "limit");
      if (active.length > 0) {
        console.log(chalk.gray("Filters:"));
        for (const [k, v] of active) {
          console.log("  " + chalk.gray(k + ":") + " " + v);
        }
      }
      console.log(chalk.gray(`\nRun with: yunxiao query run ${name}`));
    }));

  q
    .command("list")
    .description("List all saved queries")
    .action(withErrorHandling(async () => {
      const queries = listQueries();
      if (queries.length === 0) {
        console.log(chalk.yellow("No saved queries. Use: yunxiao query save <name> [filters]"));
        return;
      }
      console.log(chalk.bold(`\nSaved queries (${queries.length}):\n`));
      for (const query of queries) {
        const { name, savedAt, ...filters } = query;
        const saved = savedAt ? chalk.gray(" (saved " + savedAt.split("T")[0] + ")") : "";
        console.log("  " + chalk.cyan(name) + saved);
        const active = Object.entries(filters).filter(([, v]) => v !== undefined && v !== null && v !== false);
        if (active.length > 0) {
          console.log("    " + chalk.gray(active.map(([k, v]) => `${k}=${v}`).join(" ")));
        }
      }
      console.log();
    }));

  q
    .command("show <name>")
    .description("Show details of a saved query")
    .action(withErrorHandling(async (name) => {
      const query = getQuery(name);
      if (!query) {
        console.error(chalk.red(`Query "${name}" not found. Use: yunxiao query list`));
        process.exit(1);
      }
      console.log(chalk.bold(`\nQuery: ${name}\n`));
      const { savedAt, ...filters } = query;
      if (savedAt) console.log("  " + chalk.gray("Saved:        ") + savedAt.split("T")[0]);
      for (const [k, v] of Object.entries(filters)) {
        if (v !== undefined && v !== null && v !== false) {
          console.log("  " + chalk.gray((k + ":").padEnd(14)) + v);
        }
      }
      console.log(`\n  Run: yunxiao query run ${name}`);
      console.log();
    }));

  q
    .command("run <name>")
    .description("Run a saved query")
    .option("--page <n>", "Override page number", "1")
    .option("--limit <n>", "Override results per page")
    .action(withErrorHandling(async (name, opts) => {
      const query = getQuery(name);
      if (!query) {
        console.error(chalk.red(`Query "${name}" not found. Use: yunxiao query list`));
        process.exit(1);
      }
      const spaceId = query.project || defaultProjectId;
      if (!spaceId) {
        console.error(chalk.red("Error: project ID required (set in query or YUNXIAO_PROJECT_ID)"));
        process.exit(1);
      }
      console.log(chalk.gray(`Running query "${name}"...\n`));
      const items = await searchWorkitems(client, orgId, spaceId, {
        category: query.category || "Req",
        status: query.status,
        assignedTo: query.assignedTo,
        subject: query.query,
        sprint: query.sprint,
        priority: query.priority,
        label: query.label,
        createdAfter: query.createdAfter,
        createdBefore: query.createdBefore,
        orderBy: query.sort || "gmtCreate",
        sort: query.asc ? "asc" : "desc",
        page: parseInt(opts.page || "1"),
        perPage: parseInt(opts.limit || query.limit || "20"),
      });
      if (!items || items.length === 0) {
        console.log(chalk.yellow("No work items found"));
        return;
      }
      console.log(chalk.bold(`Found ${items.length} work item(s):\n`));
      printItems(items);
    }));

  q
    .command("delete <name>")
    .alias("rm")
    .description("Delete a saved query")
    .action(withErrorHandling(async (name) => {
      const deleted = deleteQuery(name);
      if (!deleted) {
        console.error(chalk.red(`Query "${name}" not found. Use: yunxiao query list`));
        process.exit(1);
      }
      console.log(chalk.green(`\n✓ Query "${name}" deleted!\n`));
    }));
}
