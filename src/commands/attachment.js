// src/commands/attachment.js - Attachment management commands
import chalk from "chalk";

/**
 * Register attachment management commands
 * @param {Command} program - Commander program
 * @param {AxiosInstance} client - API client
 * @param {string} orgId - Organization ID
 * @param {Function} withErrorHandling - Error handler wrapper
 */
export function registerAttachmentCommands(program, client, orgId, withErrorHandling) {
  const attachmentGroup = program
    .command("attachment")
    .alias("att")
    .description("Attachment management commands");

  // List attachments for a workitem
  attachmentGroup
    .command("list <workitemId>")
    .alias("ls")
    .description("List all attachments for a workitem")
    .action(withErrorHandling(async (workitemId) => {
      const response = await client.post(
        `/oapi/v1/projex/organizations/${orgId}/workitems/${workitemId}/attachments:search`,
        {}
      );

      const attachments = response.data?.data || [];

      if (attachments.length === 0) {
        console.log(chalk.yellow("No attachments found."));
        return;
      }

      console.log(chalk.bold(`\nAttachments for #${workitemId}:\n`));
      attachments.forEach((att, idx) => {
        console.log(`  ${idx + 1}. ${chalk.bold(att.name || att.fileName)}`);
        console.log(`     ID: ${att.id}`);
        console.log(`     Size: ${formatFileSize(att.size || 0)}`);
        console.log(`     Created: ${att.createdAt ? att.createdAt.split("T")[0] : "-"}`);
        console.log(`     URL: ${att.downloadUrl || att.url || "-"}`);
        console.log();
      });
    }));

  // Upload/create attachment
  attachmentGroup
    .command("upload <workitemId> <filePath>")
    .alias("add")
    .description("Upload an attachment to a workitem")
    .action(withErrorHandling(async (workitemId, filePath) => {
      console.log(chalk.yellow("Note: Direct file upload requires multipart/form-data handling."));
      console.log(chalk.yellow("For now, please upload via web UI and use 'attachment link' command."));
      // TODO: Implement actual file upload with axios-form-data
    }));

  // Link attachment (by URL)
  attachmentGroup
    .command("link <workitemId> <url> [name]")
    .description("Link an external URL as an attachment reference")
    .action(withErrorHandling(async (workitemId, url, name) => {
      const response = await client.post(
        `/oapi/v1/projex/organizations/${orgId}/workitems/${workitemId}/comments`,
        {
          content: `📎 Attachment: ${name || url}\n${url}`
        }
      );

      console.log(chalk.green("✓ Attachment link added as comment"));
      console.log(`  Workitem: #${workitemId}`);
      console.log(`  URL: ${url}`);
    }));

  // Delete attachment
  attachmentGroup
    .command("delete <workitemId> <attachmentId>")
    .alias("rm")
    .description("Delete an attachment from a workitem")
    .action(withErrorHandling(async (workitemId, attachmentId) => {
      await client.delete(
        `/oapi/v1/projex/organizations/${orgId}/workitems/${workitemId}/attachments/${attachmentId}`
      );

      console.log(chalk.green("✓ Attachment deleted"));
      console.log(`  Workitem: #${workitemId}`);
      console.log(`  Attachment ID: ${attachmentId}`);
    }));

  // Download attachment
  attachmentGroup
    .command("download <workitemId> <attachmentId> [outputPath]")
    .alias("get")
    .description("Download an attachment")
    .action(withErrorHandling(async (workitemId, attachmentId, outputPath) => {
      console.log(chalk.yellow("Note: Download requires handling binary response."));
      console.log(chalk.yellow("Please use the download URL from 'attachment list' command."));
      // TODO: Implement actual file download with stream handling
    }));
}

function formatFileSize(bytes) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}
