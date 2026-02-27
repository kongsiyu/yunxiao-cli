// src/commands/workitem.js
import chalk from "chalk";
import { searchWorkitems, getWorkitem, createWorkitem, updateWorkitem, addComment, listComments, getWorkitemTypes } from "../api.js";

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
    .description("List work items")
    .option("-p, --project <id>", "Project ID (default: YUNXIAO_PROJECT_ID)")
    .option("-c, --category <type>", "Category: Req, Task, Bug", "Req")
    .option("-s, --status <id>", "Filter by status ID")
    .option("-a, --assigned-to <userId>", "Filter by assignee user ID")
    .option("-q, --query <keyword>", "Search by subject keyword")
    .option("--page <n>", "Page number", "1")
    .option("--limit <n>", "Per page", "20")
    .action(withErrorHandling(async (opts) => {
      const spaceId = opts.project || defaultProjectId;
      if (!spaceId) {
        console.error(chalk.red("Error: project ID required (--project or YUNXIAO_PROJECT_ID)"));
        process.exit(1);
      }
      const items = await searchWorkitems(client, orgId, spaceId, {
        category: opts.category,
        status: opts.status,
        assignedTo: opts.assignedTo,
        subject: opts.query,
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
    .action(withErrorHandling(async (id, opts) => {
      let item;
      if (/^[A-Z]+-\d+$/i.test(id)) {
        const spaceId = opts.project || defaultProjectId;
        if (!spaceId) {
          console.error(chalk.red("Error: project ID required for serial number lookup"));
          process.exit(1);
        }
        for (const cat of ["Req", "Task", "Bug"]) {
          const items = await searchWorkitems(client, orgId, spaceId, { category: cat, perPage: 50 });
          const found = (items || []).find(i => i.serialNumber === id.toUpperCase());
          if (found) { item = found; break; }
        }
        if (!item) {
          console.error(chalk.red("Work item " + id + " not found"));
          process.exit(1);
        }
        item = await getWorkitem(client, orgId, item.id);
      } else {
        item = await getWorkitem(client, orgId, id);
      }
      console.log(chalk.bold("\nWork Item Details:\n"));
      console.log("  " + chalk.gray("Serial:  ") + (item.serialNumber || "-"));
      console.log("  " + chalk.gray("ID:      ") + item.id);
      console.log("  " + chalk.gray("Subject: ") + item.subject);
      console.log("  " + chalk.gray("Status:  ") + statusColor(item.status?.displayName || item.status?.name));
      console.log("  " + chalk.gray("Type:    ") + (item.workitemType?.name || "-"));
      console.log("  " + chalk.gray("Project: ") + (item.space?.name || "-"));
      console.log("  " + chalk.gray("Assignee:") + " " + (item.assignedTo?.name || "-"));
      console.log("  " + chalk.gray("Creator: ") + (item.creator?.name || "-"));
      console.log("  " + chalk.gray("Created: ") + formatDate(item.gmtCreate));
      console.log("  " + chalk.gray("Updated: ") + formatDate(item.gmtModified));
      if (item.description) {
        console.log("\n" + chalk.gray("Description:"));
        const desc = item.description.slice(0, 500);
        console.log(desc);
        if (item.description.length > 500) console.log(chalk.gray("... (truncated)"));
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
    .description("Update a work item by ID")
    .option("-t, --title <title>", "New title")
    .option("-d, --description <desc>", "New description")
    .option("-s, --status <statusId>", "New status ID")
    .option("--assigned-to <userId>", "New assignee user ID")
    .action(withErrorHandling(async (id, opts) => {
      const fields = {};
      if (opts.title) fields.subject = opts.title;
      if (opts.description) fields.description = opts.description;
      if (opts.status) fields.status = opts.status;
      if (opts.assignedTo) fields.assignedTo = opts.assignedTo;
      if (Object.keys(fields).length === 0) {
        console.error(chalk.yellow("No fields to update. Use --title, --description, --status, or --assigned-to"));
        process.exit(1);
      }
      await updateWorkitem(client, orgId, id, fields);
      console.log(chalk.green("\n✓ Work item " + id + " updated!\n"));
    }));

  wi
    .command("comment <id> <content>")
    .description("Add a comment to a work item")
    .action(withErrorHandling(async (id, content) => {
      const result = await addComment(client, orgId, id, content);
      console.log(chalk.green("\n✓ Comment added! (id: " + (result.id || result) + ")\n"));
    }));

  wi
    .command("comments <id>")
    .description("List comments on a work item")
    .option("--page <n>", "Page number", "1")
    .option("--limit <n>", "Per page", "20")
    .action(withErrorHandling(async (id, opts) => {
      const comments = await listComments(client, orgId, id, {
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

