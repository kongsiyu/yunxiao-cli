// src/commands/user.js - User management commands
import chalk from "chalk";
import { getProjectMembers } from "../api.js";

export function registerUserCommands(program, client, orgId, defaultProjectId, withErrorHandling) {
  const user = program.command("user").description("Manage users");

  user
    .command("list")
    .description("List project members")
    .option("-p, --project <id>", "Project ID (default: YUNXIAO_PROJECT_ID)")
    .option("-q, --query <name>", "Filter by name")
    .action(withErrorHandling(async (opts) => {
      const spaceId = opts.project || defaultProjectId;
      if (!spaceId) {
        console.error(chalk.red("Error: project ID required (--project or YUNXIAO_PROJECT_ID)"));
        process.exit(1);
      }
      const members = await getProjectMembers(client, orgId, spaceId);
      if (!members || members.length === 0) {
        console.log(chalk.yellow("No members found"));
        return;
      }
      
      let filtered = members;
      if (opts.query) {
        const q = opts.query.toLowerCase();
        filtered = members.filter(m => 
          (m.name && m.name.toLowerCase().includes(q)) || 
          (m.email && m.email.toLowerCase().includes(q))
        );
      }
      
      if (filtered.length === 0) {
        console.log(chalk.yellow("No members matching '" + opts.query + "'"));
        return;
      }
      
      console.log(chalk.bold("\nFound " + filtered.length + " member(s):\n"));
      for (const member of filtered) {
        const name = chalk.cyan((member.name || member.loginName || member.id).padEnd(20));
        const role = chalk.gray(member.role?.name || member.role || "-");
        const email = member.email ? chalk.gray(member.email) : "";
        console.log(name + " " + role + "  " + email);
      }
      console.log();
    }));

  user
    .command("search <name>")
    .description("Search users by name")
    .option("-p, --project <id>", "Project ID (search within project members)")
    .action(withErrorHandling(async (name, opts) => {
      if (opts.project) {
        // Search within project members
        const members = await getProjectMembers(client, orgId, opts.project);
        const q = name.toLowerCase();
        const filtered = members.filter(m => 
          (m.name && m.name.toLowerCase().includes(q)) || 
          (m.email && m.email.toLowerCase().includes(q))
        );
        if (filtered.length === 0) {
          console.log(chalk.yellow("No members matching '" + name + "'"));
          return;
        }
        console.log(chalk.bold("\nFound " + filtered.length + " member(s):\n"));
        for (const member of filtered) {
          const memberName = chalk.cyan((member.name || member.loginName || member.id).padEnd(20));
          const role = chalk.gray(member.role?.name || member.role || "-");
          const email = member.email ? chalk.gray(member.email) : "";
          console.log(memberName + " " + role + "  " + email);
        }
        console.log();
      } else {
        console.log(chalk.yellow("Project search not yet implemented. Use --project <id> to search within a project."));
      }
    }));
}
