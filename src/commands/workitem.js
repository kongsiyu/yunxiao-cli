// src/commands/workitem.js
import chalk from "chalk";
import { searchWorkitems, getWorkitem, createWorkitem, updateWorkitem, addComment, listComments, getWorkitemTypes, resolveWorkitemId } from "../api.js";
import { setQuery } from "./storage.js";

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

export function registerWorkitemCommands(program, client, orgId, defaultProjectId, withErrorHandling, currentUserId) {
  const wi = program.command("workitem").alias("wi").description("Manage work items");

  wi
    .command("list")
    .description("List work items with optional advanced filters")
    .option("-p, --project <id>", "Project ID (default: YUNXIAO_PROJECT_ID)")
    .option("-c, --category <type>", "Category: Req, Task, Bug", "Req")
    .option("-s, --status <id>", "Filter by status ID")
    .option("-a, --assigned-to <userId>", "Filter by assignee user ID")
    .option("-q, --query <keyword>", "Search by subject keyword")
    .option("--sprint <id>", "Filter by sprint/iteration ID")
    .option("--priority <level>", "Filter by priority")
    .option("--label <name>", "Filter by label")
    .option("--created-after <date>", "Filter items created after date (YYYY-MM-DD)")
    .option("--created-before <date>", "Filter items created before date (YYYY-MM-DD)")
    .option("--sort <field>", "Sort field: gmtCreate, gmtModified, subject", "gmtCreate")
    .option("--asc", "Sort ascending (default: desc)")
    .option("--page <n>", "Page number", "1")
    .option("--limit <n>", "Per page", "20")
    .option("--save-as <name>", "Save these filters as a named query")
    .action(withErrorHandling(async (opts) => {
      const spaceId = opts.project || defaultProjectId;
      if (!spaceId) {
        console.error(chalk.red("Error: project ID required (--project or YUNXIAO_PROJECT_ID)"));
        process.exit(1);
      }
      if (opts.saveAs) {
        const filters = { project: spaceId, category: opts.category };
        if (opts.status) filters.status = opts.status;
        if (opts.assignedTo) filters.assignedTo = opts.assignedTo;
        if (opts.query) filters.query = opts.query;
        if (opts.sprint) filters.sprint = opts.sprint;
        if (opts.priority) filters.priority = opts.priority;
        if (opts.label) filters.label = opts.label;
        if (opts.createdAfter) filters.createdAfter = opts.createdAfter;
        if (opts.createdBefore) filters.createdBefore = opts.createdBefore;
        if (opts.sort) filters.sort = opts.sort;
        if (opts.asc) filters.asc = true;
        filters.limit = opts.limit;
        setQuery(opts.saveAs, filters);
        console.log(chalk.green(`\n✓ Query "${opts.saveAs}" saved! Run with: yunxiao query run ${opts.saveAs}\n`));
      }
      const items = await searchWorkitems(client, orgId, spaceId, {
        category: opts.category,
        status: opts.status,
        assignedTo: opts.assignedTo,
        subject: opts.query,
        sprint: opts.sprint,
        priority: opts.priority,
        label: opts.label,
        createdAfter: opts.createdAfter,
        createdBefore: opts.createdBefore,
        orderBy: opts.sort || "gmtCreate",
        sort: opts.asc ? "asc" : "desc",
        page: parseInt(opts.page),
        perPage: parseInt(opts.limit),
      });
      if (!items || items.length === 0) {
        console.log(chalk.yellow("No work items found"));
        return;
      }
      console.log(chalk.bold("\nFound " + items.length + " work item(s):\n"));
      for (const item of items) {
        const sn = chalk.cyan((item.serialNumber || item.id.slice(0, 8)).padEnd(10));
        const status = statusColor(item.status?.displayName || item.status?.name);
        console.log(sn + " " + chalk.white(item.subject));
        console.log("  " + chalk.gray("Status:") + " " + status + "  " + chalk.gray("Assignee:") + " " + (item.assignedTo?.name || "-") + "  " + chalk.gray("Created:") + " " + formatDate(item.gmtCreate));
      }
    }));

  wi
    .command("view <id>")
    .description("View work item details by ID or serial number (e.g. GJBL-1)")
    .option("-p, --project <id>", "Project ID (needed for serial number lookup)")
    .option("-c, --category <type>", "Category: Req, Task, Bug", "Req")
    .action(withErrorHandling(async (id, opts) => {
      let item;
      if (/^[A-Z]+-\d+$/i.test(id)) {
        const spaceId = opts.project || defaultProjectId;
        if (!spaceId) {
          console.error(chalk.red("Error: project ID required for serial number lookup"));
          process.exit(1);
        }
        // Search in specified category only
        const items = await searchWorkitems(client, orgId, spaceId, { category: opts.category, perPage: 100 });
        item = (items || []).find(i => i.serialNumber === id.toUpperCase());
        if (!item) {
          console.error(chalk.red("Work item " + id + " not found in category " + opts.category));
          console.error(chalk.gray("Try: yunxiao wi view " + id + " -c <category>"));
          process.exit(1);
        }
        item = await getWorkitem(client, orgId, item.id);
      } else {
        item = await getWorkitem(client, orgId, id);
      }
      console.log(chalk.bold("\nWork Item Details:\n"));
      console.log("  " + chalk.gray("Serial:     ") + (item.serialNumber || "-"));
      console.log("  " + chalk.gray("ID:         ") + item.id);
      console.log("  " + chalk.gray("Subject:    ") + item.subject);
      console.log("  " + chalk.gray("Status:     ") + statusColor(item.status?.displayName || item.status?.name));
      console.log("  " + chalk.gray("Type:       ") + (item.workitemType?.name || "-"));
      // Priority from custom fields (API returns it in customFieldValues)
      const priorityField = item.customFieldValues?.find(f => f.fieldName === "优先级");
      const priority = priorityField?.values?.[0]?.displayValue || item.priority?.displayName || item.priority?.name || "-";
      console.log("  " + chalk.gray("Priority:   ") + priority);
      console.log("  " + chalk.gray("Sprint:     ") + (item.iteration?.name || item.sprint?.name || "-"));
      console.log("  " + chalk.gray("Project:    ") + (item.space?.name || "-"));
      console.log("  " + chalk.gray("Assignee:   ") + (item.assignedTo?.name || "-"));
      console.log("  " + chalk.gray("Creator:    ") + (item.creator?.name || "-"));
      console.log("  " + chalk.gray("Created:    ") + formatDate(item.gmtCreate));
      console.log("  " + chalk.gray("Updated:    ") + formatDate(item.gmtModified));
      if (item.labels && item.labels.length > 0) {
        console.log("  " + chalk.gray("Labels:     ") + item.labels.map(l => l.name).join(", "));
      }
      if (item.parentWorkitem) {
        console.log("  " + chalk.gray("Parent:     ") + (item.parentWorkitem.serialNumber || item.parentWorkitem.id));
      }
      if (item.children && item.children.length > 0) {
        console.log("  " + chalk.gray("Children:   ") + item.children.map(c => c.serialNumber || c.id).join(", "));
      }
      if (item.description) {
        console.log("\n" + chalk.gray("Description:"));
        console.log(item.description);
      }
    }));

  wi
    .command("create")
    .description("Create a new work item")
    .requiredOption("-t, --title <title>", "Work item title")
    .option("-p, --project <id>", "Project ID")
    .option("-c, --category <type>", "Category: Req, Task, Bug", "Req")
    .option("-d, --description <desc>", "Description")
    .option("--type-id <id>", "Work item type ID (auto-detected if not set)")
    .option("--assigned-to <userId>", "Assignee user ID (or set YUNXIAO_USER_ID)")
    .action(withErrorHandling(async (opts) => {
      const spaceId = opts.project || defaultProjectId;
      if (!spaceId) {
        console.error(chalk.red("Error: project ID required (--project or YUNXIAO_PROJECT_ID)"));
        process.exit(1);
      }
      const assignedTo = opts.assignedTo || process.env.YUNXIAO_USER_ID || currentUserId;
      if (!assignedTo) {
        console.error(chalk.red("Error: --assigned-to or YUNXIAO_USER_ID env var is required"));
        process.exit(1);
      }
      let typeId = opts.typeId;
      if (!typeId) {
        const types = await getWorkitemTypes(client, orgId, spaceId, opts.category);
        const defaultType = types.find(t => t.defaultType) || types[0];
        if (!defaultType) {
          console.error(chalk.red("No work item types found for category: " + opts.category));
          process.exit(1);
        }
        typeId = defaultType.id;
        console.log(chalk.gray("Using type: " + defaultType.name + " (" + typeId + ")"));
      }
      const data = {
        spaceId,
        subject: opts.title,
        workitemTypeId: typeId,
        assignedTo,
      };
      if (opts.description) data.description = opts.description;
      const created = await createWorkitem(client, orgId, data);
      console.log(chalk.green("\n✓ Work item created!\n"));
      console.log("  " + chalk.gray("ID:      ") + created.id);
      console.log("  " + chalk.gray("Serial:  ") + (created.serialNumber || "(pending)"));
      console.log("  " + chalk.gray("Subject: ") + (created.subject || opts.title));
    }));

  wi
    .command("update <id>")
    .description("Update a work item by ID or serial number")
    .option("-p, --project <id>", "Project ID (needed for serial number)")
    .option("-t, --title <title>", "New title")
    .option("-d, --description <desc>", "New description")
    .option("-s, --status <statusId>", "New status ID")
    .option("--assigned-to <userId>", "New assignee user ID")
    .action(withErrorHandling(async (id, opts) => {
      const spaceId = opts.project || defaultProjectId;
      const resolvedId = await resolveWorkitemId(client, orgId, spaceId, id);
      const fields = {};
      if (opts.title) fields.subject = opts.title;
      if (opts.description) fields.description = opts.description;
      if (opts.status) fields.status = opts.status;
      if (opts.assignedTo) fields.assignedTo = opts.assignedTo;
      if (Object.keys(fields).length === 0) {
        console.error(chalk.yellow("No fields to update. Use --title, --description, --status, or --assigned-to"));
        process.exit(1);
      }
      await updateWorkitem(client, orgId, resolvedId, fields);
      console.log(chalk.green("\n✓ Work item " + id + " updated!\n"));
    }));

  wi
    .command("comment <id> <content>")
    .description("Add a comment to a work item by ID or serial number")
    .option("-p, --project <id>", "Project ID (needed for serial number)")
    .action(withErrorHandling(async (id, content, opts) => {
      const spaceId = opts.project || defaultProjectId;
      const resolvedId = await resolveWorkitemId(client, orgId, spaceId, id);
      const result = await addComment(client, orgId, resolvedId, content);
      console.log(chalk.green("\n✓ Comment added! (id: " + (result.id || result) + ")\n"));
    }));

  wi
    .command("comments <id>")
    .description("List comments on a work item")
    .option("-p, --project <id>", "Project ID (needed for serial number)")
    .option("--page <n>", "Page number", "1")
    .option("--limit <n>", "Per page", "20")
    .action(withErrorHandling(async (id, opts) => {
      const spaceId = opts.project || defaultProjectId;
      const resolvedId = await resolveWorkitemId(client, orgId, spaceId, id);
      const comments = await listComments(client, orgId, resolvedId, {
        page: parseInt(opts.page),
        perPage: parseInt(opts.limit),
      });
      if (!comments || comments.length === 0) {
        console.log(chalk.yellow("No comments found"));
        return;
      }
      console.log(chalk.bold("\n" + comments.length + " comment(s):\n"));
      for (const c of comments) {
        console.log(chalk.cyan(c.creator?.name || "unknown") + " " + chalk.gray(formatDate(c.gmtCreate)));
        console.log("  " + (c.content || c.commentText || "(empty)"));
        console.log();
      }
    }));

  wi
    .command("types")
    .description("List work item types for a project")
    .option("-p, --project <id>", "Project ID")
    .option("-c, --category <type>", "Category: Req, Task, Bug", "Req")
    .action(withErrorHandling(async (opts) => {
      const spaceId = opts.project || defaultProjectId;
      if (!spaceId) {
        console.error(chalk.red("Error: project ID required (--project or YUNXIAO_PROJECT_ID)"));
        process.exit(1);
      }
      const types = await getWorkitemTypes(client, orgId, spaceId, opts.category);
      console.log(chalk.bold("\nWork item types (" + opts.category + "):\n"));
      for (const t of types) {
        const def = t.defaultType ? chalk.green(" [default]") : "";
        console.log("  " + chalk.cyan(t.id) + "  " + t.name + def);
      }
    }));
}

