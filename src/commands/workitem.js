// src/commands/workitem.js
import chalk from "chalk";
import { getWorkitem, createWorkitem, updateWorkitem, deleteWorkitem, addComment, listComments, getWorkitemTypes, resolveWorkitemId, searchWorkitems } from "../api.js";
import { printJson, printError } from "../output.js";
import { AppError, ERROR_CODE } from "../errors.js";
import { t, tx } from "../i18n/index.js";

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

export function registerWorkitemCommands(program, client, orgId, defaultProjectId, withErrorHandling, currentUserId, jsonMode) {
  const wi = program.command("workitem").alias("wi").description("Manage work items");

  wi
    .command("list")
    .description("List work items with optional advanced filters")
    .option("-p, --project <id>", "Project ID (default: YUNXIAO_PROJECT_ID)")
    .option("-c, --category <type>", "Category: Req, Task, Bug (default: Req,Task,Bug)", "Req,Task,Bug")
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
    .action(withErrorHandling(async (opts) => {
      if (!client || !orgId) {
        throw new AppError(ERROR_CODE.AUTH_MISSING, t("errors.auth.required", "Authentication required. Run: yunxiao auth login"));
      }
      const spaceId = opts.project || defaultProjectId;
      if (!spaceId) {
        printError("INVALID_ARGS", t("commands.wi.list.projectRequired", "project ID required (--project or YUNXIAO_PROJECT_ID)"), jsonMode);
        process.exit(1);
      }
      let assignedToId = opts.assignedTo;
      if (assignedToId === 'me') {
        if (!currentUserId) {
          printError("INVALID_ARGS", t("commands.wi.list.meResolutionUnavailable", "Cannot resolve 'me': current user ID unavailable"), jsonMode);
          process.exit(1);
        }
        assignedToId = currentUserId;
      }
      const { items, total } = await searchWorkitems(client, orgId, spaceId, {
        category: opts.category,
        status: opts.status,
        assignedTo: assignedToId,
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
      if (jsonMode) {
        printJson({ items: items || [], total });
        return;
      }
      if (!items || items.length === 0) {
        console.log(chalk.yellow(t("commands.wi.list.empty", "No work items found")));
        return;
      }
      console.log(chalk.bold(`\n${tx("commands.wi.list.found", "Found {count} work item(s):", { count: items.length })}\n`));
      for (const item of items) {
        const sn = chalk.cyan((item.serialNumber || item.id.slice(0, 8)).padEnd(10));
        const status = statusColor(item.status?.displayName || item.status?.name);
        console.log(sn + " " + chalk.white(item.subject));
        console.log(
          `  ${chalk.gray(`${t("output.header.status", "Status")}:`)} ${status}  ` +
            `${chalk.gray(`${t("output.header.assignee", "Assignee")}:`)} ${item.assignedTo?.name || "-"}  ` +
            `${chalk.gray(`${t("output.header.created", "Created")}:`)} ${formatDate(item.gmtCreate)}`
        );
      }
    }));

  wi
    .command("view <id>")
    .description("View work item details by ID or serial number (e.g. GJBL-1)")
    .option("-p, --project <id>", "Project ID (needed for serial number lookup)")
    .action(withErrorHandling(async (id, opts) => {
      if (!client || !orgId) {
        throw new AppError(ERROR_CODE.AUTH_MISSING, t("errors.auth.required", "Authentication required. Run: yunxiao auth login"));
      }
      const spaceId = opts.project || defaultProjectId;
      if (/^[A-Z]+-\d+$/i.test(id) && !spaceId) {
        printError("INVALID_ARGS", t("commands.wi.view.projectRequired", "project ID required for serial number lookup"), jsonMode);
        process.exit(1);
      }
      const resolvedId = await resolveWorkitemId(client, orgId, spaceId, id);
      const item = await getWorkitem(client, orgId, resolvedId);
      if (jsonMode) {
        printJson(item);
        return;
      }
      console.log(chalk.bold(`\n${t("commands.wi.view.title", "Work Item Details:")}\n`));
      console.log(`  ${chalk.gray(`${t("commands.wi.view.serial", "Serial")}:`)} ${item.serialNumber || "-"}`);
      console.log(`  ${chalk.gray(`${t("output.header.id", "ID")}:`)} ${item.id}`);
      console.log(`  ${chalk.gray(`${t("commands.wi.view.subject", "Subject")}:`)} ${item.subject}`);
      console.log(`  ${chalk.gray(`${t("output.header.status", "Status")}:`)} ${statusColor(item.status?.displayName || item.status?.name)}`);
      console.log(`  ${chalk.gray(`${t("commands.wi.view.type", "Type")}:`)} ${item.workitemType?.name || "-"}`);
      const priorityField = item.customFieldValues?.find(f => f.fieldName === "优先级");
      const priority = priorityField?.values?.[0]?.displayValue || item.priority?.displayName || item.priority?.name || "-";
      console.log(`  ${chalk.gray(`${t("commands.wi.view.priority", "Priority")}:`)} ${priority}`);
      console.log(`  ${chalk.gray(`${t("commands.wi.view.sprint", "Sprint")}:`)} ${item.iteration?.name || item.sprint?.name || "-"}`);
      console.log(`  ${chalk.gray(`${t("commands.wi.view.project", "Project")}:`)} ${item.space?.name || "-"}`);
      console.log(`  ${chalk.gray(`${t("output.header.assignee", "Assignee")}:`)} ${item.assignedTo?.name || "-"}`);
      console.log(`  ${chalk.gray(`${t("commands.wi.view.creator", "Creator")}:`)} ${item.creator?.name || "-"}`);
      console.log(`  ${chalk.gray(`${t("output.header.created", "Created")}:`)} ${formatDate(item.gmtCreate)}`);
      console.log(`  ${chalk.gray(`${t("output.header.updated", "Updated")}:`)} ${formatDate(item.gmtModified)}`);
      if (item.labels && item.labels.length > 0) {
        console.log(`  ${chalk.gray(`${t("commands.wi.view.labels", "Labels")}:`)} ${item.labels.map(l => l.name).join(", ")}`);
      }
      if (item.parentWorkitem) {
        console.log(`  ${chalk.gray(`${t("commands.wi.view.parent", "Parent")}:`)} ${item.parentWorkitem.serialNumber || item.parentWorkitem.id}`);
      }
      if (item.children && item.children.length > 0) {
        console.log(`  ${chalk.gray(`${t("commands.wi.view.children", "Children")}:`)} ${item.children.map(c => c.serialNumber || c.id).join(", ")}`);
      }
      if (item.description) {
        console.log(`\n${chalk.gray(`${t("commands.wi.view.description", "Description")}:`)}`);
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
    .option("--type <id>", "Work item type ID (auto-detected if not set)")
    .option("--type-id <id>", "Work item type ID (alias for --type)")
    .option("--assigned-to <userId>", "Assignee user ID (optional; defaults to current user if available)")
    .option("--sprint <sprintId>", "Sprint ID to assign this work item to")
    .option("--extra-json <json>", "JSON string with additional fields (merged into request body)")
    .action(withErrorHandling(async (opts) => {
      if (!client || !orgId) throw new AppError(ERROR_CODE.AUTH_MISSING, 'Authentication required. Run: yunxiao auth login');
      const spaceId = opts.project || defaultProjectId;
      if (!spaceId) {
        printError("INVALID_ARGS", "project ID required (--project or YUNXIAO_PROJECT_ID)", jsonMode);
        process.exit(1);
      }
      const assignedTo = opts.assignedTo || process.env.YUNXIAO_USER_ID || currentUserId;
      let typeId = opts.type || opts.typeId;
      if (!typeId) {
        const types = await getWorkitemTypes(client, orgId, spaceId, opts.category);
        const defaultType = types.find(t => t.defaultType) || types[0];
        if (!defaultType) {
          printError("NOT_FOUND", `No work item types found for category: ${opts.category}`, jsonMode);
          process.exit(1);
        }
        typeId = defaultType.id;
        if (!jsonMode) {
          console.log(chalk.gray("Using type: " + defaultType.name + " (" + typeId + ")"));
        }
      }
      let jsonFields = {};
      if (opts.extraJson) {
        try {
          jsonFields = JSON.parse(opts.extraJson);
        } catch {
          printError("INVALID_ARGS", "--extra-json value is not valid JSON", jsonMode);
          process.exit(1);
        }
      }
      const data = {
        spaceId,
        subject: opts.title,
        workitemTypeId: typeId,
        ...jsonFields,
      };
      if (assignedTo) data.assignedTo = assignedTo;
      if (opts.description) data.description = opts.description;
      if (opts.sprint) data.sprint = opts.sprint;
      const created = await createWorkitem(client, orgId, data);
      if (jsonMode) {
        printJson(created);
        return;
      }
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
    .option("--sprint <sprintId>", "New sprint ID")
    .option("--extra-json <json>", "JSON string with additional fields (merged into request body)")
    .action(withErrorHandling(async (id, opts) => {
      if (!client || !orgId) {
        throw new AppError(ERROR_CODE.AUTH_MISSING, t("errors.auth.required", "Authentication required. Run: yunxiao auth login"));
      }
      const spaceId = opts.project || defaultProjectId;
      const resolvedId = await resolveWorkitemId(client, orgId, spaceId, id);

      let jsonFields = {};
      if (opts.extraJson) {
        try {
          jsonFields = JSON.parse(opts.extraJson);
        } catch {
          printError("INVALID_ARGS", t("commands.wi.update.invalidExtraJson", "--extra-json value is not valid JSON"), jsonMode);
          process.exit(1);
        }
      }
      const fields = { ...jsonFields };
      if (opts.title) fields.subject = opts.title;
      if (opts.description) fields.description = opts.description;
      if (opts.status) fields.status = opts.status;
      if (opts.assignedTo) fields.assignedTo = opts.assignedTo;
      if (opts.sprint) fields.sprint = opts.sprint;
      if (Object.keys(fields).length === 0) {
        printError(
          "INVALID_ARGS",
          t(
            "commands.wi.update.noFields",
            "No fields to update. Use --title, --description, --status, --assigned-to, --sprint, or --extra-json"
          ),
          jsonMode
        );
        process.exit(1);
      }
      await updateWorkitem(client, orgId, resolvedId, fields);
      if (jsonMode) {
        const updated = await getWorkitem(client, orgId, resolvedId);
        printJson(updated);
        return;
      }
      console.log(chalk.green(`\n✓ ${tx("commands.wi.update.success", "Work item {id} updated!", { id })}\n`));
    }));

  wi
    .command("comment <id> <content>")
    .description("Add a comment to a work item by ID or serial number")
    .option("-p, --project <id>", "Project ID (needed for serial number)")
    .action(withErrorHandling(async (id, content, opts) => {
      if (!client || !orgId) throw new AppError(ERROR_CODE.AUTH_MISSING, 'Authentication required. Run: yunxiao auth login');
      const spaceId = opts.project || defaultProjectId;
      if (/^[A-Za-z]+-\d+$/.test(id) && !spaceId) {
        printError("INVALID_ARGS", "project ID required for serial number lookup", jsonMode);
        process.exit(1);
      }
      const resolvedId = await resolveWorkitemId(client, orgId, spaceId, id);
      const result = await addComment(client, orgId, resolvedId, content);
      const commentId = result?.id ?? resolvedId;
      if (jsonMode) {
        printJson({ success: true, id: commentId, workitemId: resolvedId });
        return;
      }
      console.log(chalk.green("\n✓ Comment added! (id: " + commentId + ")\n"));
    }));

  wi
    .command("comments <id>")
    .description("List comments on a work item")
    .option("-p, --project <id>", "Project ID (needed for serial number)")
    .option("--page <n>", "Page number", "1")
    .option("--limit <n>", "Per page", "20")
    .action(withErrorHandling(async (id, opts) => {
      if (!client || !orgId) throw new AppError(ERROR_CODE.AUTH_MISSING, 'Authentication required. Run: yunxiao auth login');
      const spaceId = opts.project || defaultProjectId;
      if (/^[A-Z]+-\d+$/i.test(id) && !spaceId) {
        printError('INVALID_ARGS', 'project ID required for serial number lookup (--project or YUNXIAO_PROJECT_ID)', jsonMode);
        process.exit(1);
      }
      const resolvedId = await resolveWorkitemId(client, orgId, spaceId, id);
      const raw = await listComments(client, orgId, resolvedId, {
        page: parseInt(opts.page),
        perPage: parseInt(opts.limit),
      });
      const comments = Array.isArray(raw) ? raw : (raw?.data ?? []);
      const total = raw?.total ?? comments.length;
      if (jsonMode) {
        printJson({ comments, total });
        return;
      }
      if (comments.length === 0) {
        console.log(chalk.yellow('No comments found'));
        return;
      }
      console.log(chalk.bold('\n' + comments.length + ' comment(s):\n'));
      for (const c of comments) {
        console.log(chalk.cyan(c.creator?.name || c.user?.name || 'unknown') + ' ' + chalk.gray(formatDate(c.gmtCreate)));
        console.log('  ' + (c.content || c.commentText || '(empty)'));
        console.log();
      }
    }));

  wi
    .command("types")
    .description("List work item types for a project")
    .option("-p, --project <id>", "Project ID")
    .option("-c, --category <type>", "Category: Req, Task, Bug", "Req")
    .action(withErrorHandling(async (opts) => {
      if (!client || !orgId) throw new AppError(ERROR_CODE.AUTH_MISSING, 'Authentication required. Run: yunxiao auth login');
      const spaceId = opts.project || defaultProjectId;
      if (!spaceId) {
        printError("INVALID_ARGS", "project ID required (--project or YUNXIAO_PROJECT_ID)", jsonMode);
        process.exit(1);
      }
      const types = await getWorkitemTypes(client, orgId, spaceId, opts.category);
      if (jsonMode) {
        const mapped = (types || []).map(t => ({
          typeId: t.id,
          name: t.name,
          category: t.categoryId ?? opts.category,
        }));
        printJson({ types: mapped, total: mapped.length });
        return;
      }
      console.log(chalk.bold("\nWork item types (" + opts.category + "):\n"));
      for (const t of (types || [])) {
        const def = t.defaultType ? chalk.green(" [default]") : "";
        const cat = chalk.gray("[" + (t.categoryId ?? opts.category) + "]");
        console.log("  " + chalk.cyan(t.id) + "  " + t.name + def + "  " + cat);
      }
    }));

  wi
    .command("delete <id>")
    .description("Delete a work item by ID or serial number")
    .option("-p, --project <id>", "Project ID (needed for serial number)")
    .option("-f, --force", "Skip confirmation prompt")
    .action(withErrorHandling(async (id, opts) => {
      if (!client || !orgId) throw new AppError(ERROR_CODE.AUTH_MISSING, 'Authentication required. Run: yunxiao auth login');
      const spaceId = opts.project || defaultProjectId;
      if (/^[A-Z]+-\d+$/i.test(id) && !spaceId) {
        printError("INVALID_ARGS", "project ID required for serial number lookup (--project or YUNXIAO_PROJECT_ID)", jsonMode);
        process.exit(1);
      }
      const resolvedId = await resolveWorkitemId(client, orgId, spaceId, id);

      if (!opts.force) {
        if (jsonMode) {
          printError("INVALID_ARGS", "use --force to delete without confirmation prompt in --json mode", jsonMode);
          process.exit(1);
        }
        const readline = await import("readline");
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        const answer = await new Promise(resolve => rl.question(chalk.yellow("Are you sure you want to delete work item " + id + "? [y/N] "), resolve));
        rl.close();
        if (answer.toLowerCase() !== "y") {
          console.log(chalk.gray("Cancelled"));
          return;
        }
      }

      await deleteWorkitem(client, orgId, resolvedId);
      if (jsonMode) {
        printJson({ success: true, id: resolvedId });
        return;
      }
      console.log(chalk.green("\n✓ Work item " + id + " deleted!\n"));
    }));
}
