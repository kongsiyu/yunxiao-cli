// src/commands/workitem.js
import chalk from "chalk";
import { searchWorkitems, getWorkitem, createWorkitem, updateWorkitem, addComment, listComments, getWorkitemTypes } from "../api.js";

function formatDate(ts) {
  if (!ts) return "-";
  return new Date(ts).toISOString().split("T")[0];
}

function formatDateTime(ts) {
  if (!ts) return "-";
  return new Date(ts).toISOString().replace("T", " ").slice(0, 16) + " UTC";
}

function statusColor(name) {
  if (!name) return chalk.gray("-");
  const n = (name || "").toLowerCase();
  if (n.includes("done") || n.includes("completed") || n.includes("close") || n.includes("finish")) return chalk.green(name);
  if (n.includes("progress") || n.includes("design") || n.includes("review")) return chalk.yellow(name);
  if (n.includes("cancel") || n.includes("reject")) return chalk.gray(name);
  return chalk.blue(name);
}

function priorityLabel(p) {
  if (p === null || p === undefined || p === "" ) return chalk.gray("-");
  const n = typeof p === "number" ? p : parseInt(p, 10);
  if (!isNaN(n)) {
    if (n === 0) return chalk.gray("None");
    if (n === 1) return chalk.red("Urgent");
    if (n === 2) return chalk.yellow("High");
    if (n === 3) return chalk.blue("Medium");
    if (n === 4) return chalk.gray("Low");
  }
  const s = String(p).toLowerCase();
  if (s.includes("urgent") || s.includes("critical")) return chalk.red(String(p));
  if (s.includes("high")) return chalk.yellow(String(p));
  if (s.includes("medium") || s.includes("normal")) return chalk.blue(String(p));
  if (s.includes("low")) return chalk.gray(String(p));
  return chalk.white(String(p));
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
      const sep = chalk.gray("─".repeat(60));

      // Header: serial + title
      const serial = item.serialNumber || item.id.slice(0, 8);
      console.log("\n" + chalk.bold(chalk.cyan(serial) + "  " + item.subject));

      // Status line
      const statusStr = statusColor(item.status?.displayName || item.status?.name || "?");
      const creatorName = item.creator?.name || "?";
      console.log(statusStr + chalk.gray("  •  ") + chalk.white(creatorName) + chalk.gray("  •  created ") + formatDateTime(item.gmtCreate) + chalk.gray("  •  updated ") + formatDateTime(item.gmtModified));
      console.log();

      // Metadata fields
      const G = (s) => chalk.gray(s);
      const assigneeRaw = item.assignedTo;
      const assigneeName = Array.isArray(assigneeRaw)
        ? assigneeRaw.map(a => a.name).filter(Boolean).join(", ") || "-"
        : (assigneeRaw?.name || "-");

      console.log("  " + G("Priority:") + " " + priorityLabel(item.priority));
      console.log("  " + G("Type:    ") + " " + (item.workitemType?.name || "-"));
      console.log("  " + G("Sprint:  ") + " " + (item.sprint?.name || "-"));
      console.log("  " + G("Assignee:") + " " + assigneeName);
      console.log("  " + G("Project: ") + " " + (item.space?.name || "-"));
      console.log("  " + G("ID:      ") + " " + item.id);

      // Labels / Tags
      const rawTags = item.tags || item.labels || [];
      const tagNames = rawTags.map(t => (typeof t === "string" ? t : t.name)).filter(Boolean);
      if (tagNames.length > 0) {
        console.log("\n  " + G("Labels:") + " " + tagNames.map(t => chalk.magenta(t)).join(chalk.gray(", ")));
      }

      // Description
      console.log("\n" + sep);
      if (item.description) {
        console.log("\n" + chalk.bold("Description") + "\n");
        console.log(item.description);
      } else {
        console.log(chalk.gray("\nNo description."));
      }

      // Relations: parent, children, and related work items
      const relations = [];

      if (item.parent || item.parentId) {
        const parent = item.parent;
        const parentSerial = parent?.serialNumber || (item.parentId ? item.parentId.slice(0, 8) : null) || "-";
        const parentTitle = parent?.subject || "";
        relations.push({ kind: "Parent   ", serial: parentSerial, title: parentTitle });
      }

      const children = item.children || item.childrenWorkItems || [];
      for (const child of children) {
        const childSerial = child.serialNumber || child.id?.slice(0, 8) || "-";
        relations.push({ kind: "Child    ", serial: childSerial, title: child.subject || "" });
      }

      const related = item.relatedWorkItems || item.relations || [];
      for (const r of related) {
        const rtype = r.type || r.relationType || "Related";
        const rSerial = r.serialNumber || r.id?.slice(0, 8) || "-";
        relations.push({ kind: String(rtype).padEnd(9), serial: rSerial, title: r.subject || "" });
      }

      if (relations.length > 0) {
        console.log("\n" + sep);
        console.log("\n" + chalk.bold("Relations") + "\n");
        for (const r of relations) {
          console.log("  " + G(r.kind) + " " + chalk.cyan(r.serial) + "  " + r.title);
        }
      }

      console.log();
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

