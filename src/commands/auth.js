// src/commands/auth.js - yunxiao auth login/status/logout
import readline from "readline";
import chalk from "chalk";
import { createClientWithPat, loadSavedConfig, saveConfig, clearConfig } from "../api.js";

function prompt(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

function promptSecret(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    process.stdout.write(question);
    rl._writeToOutput = (s) => {
      if (s === "\r\n" || s === "\n" || s === "\r") {
        process.stdout.write("\n");
      }
      // Suppress echoing of typed characters
    };
    rl.question("", (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

export function registerAuthCommands(program) {
  const auth = program.command("auth").description("Manage authentication");

  // auth login
  auth
    .command("login")
    .description("Authenticate with Yunxiao using a Personal Access Token")
    .action(async () => {
      try {
        console.log(chalk.bold("\nYunxiao Authentication\n"));
        console.log(chalk.gray("Generate a PAT at: https://devops.aliyun.com/account/setting/tokens\n"));

        const pat = await promptSecret("Enter your PAT: ");
        if (!pat.trim()) {
          console.error(chalk.red("PAT cannot be empty"));
          process.exit(1);
        }

        // Verify PAT by fetching current user
        process.stdout.write(chalk.gray("\nVerifying PAT... "));
        const client = createClientWithPat(pat.trim());
        let user;
        try {
          const res = await client.get("/oapi/v1/platform/user");
          user = res.data;
          console.log(chalk.green("✓"));
        } catch (err) {
          console.log(chalk.red("✗"));
          if (err.response?.status === 401 || err.response?.status === 403) {
            console.error(chalk.red("Invalid PAT. Please check and try again."));
          } else {
            console.error(chalk.red("Failed to verify PAT:"), err.response?.data?.errorMessage || err.message);
          }
          process.exit(1);
        }

        console.log(chalk.green("✓") + " Authenticated as " + chalk.bold(user.name || user.id));

        // Fetch organizations
        process.stdout.write(chalk.gray("Fetching organizations... "));
        let orgs;
        try {
          const res = await client.get("/oapi/v1/platform/organizations");
          orgs = res.data;
          console.log(chalk.green("✓"));
        } catch (err) {
          console.log(chalk.red("✗"));
          console.error(chalk.red("Failed to fetch organizations:"), err.response?.data?.errorMessage || err.message);
          process.exit(1);
        }

        if (!orgs || orgs.length === 0) {
          console.error(chalk.red("No organizations found for this account."));
          process.exit(1);
        }

        let selectedOrg;
        if (orgs.length === 1) {
          selectedOrg = orgs[0];
          console.log(chalk.green("✓") + " Organization: " + chalk.bold(selectedOrg.name));
        } else {
          console.log(chalk.bold("\nSelect an organization:\n"));
          orgs.forEach((org, i) => {
            console.log(`  ${chalk.cyan((i + 1) + ".")} ${org.name} ${chalk.gray("(" + org.id + ")")}`);
          });
          console.log();
          const choice = await prompt("Enter number [1]: ");
          const idx = choice.trim() === "" ? 0 : parseInt(choice.trim(), 10) - 1;
          if (isNaN(idx) || idx < 0 || idx >= orgs.length) {
            console.error(chalk.red("Invalid selection."));
            process.exit(1);
          }
          selectedOrg = orgs[idx];
        }

        const config = {
          pat: pat.trim(),
          userId: user.id,
          userName: user.name || null,
          orgId: selectedOrg.id,
          orgName: selectedOrg.name || null,
        };
        saveConfig(config);

        console.log();
        console.log(chalk.green("✓ Login successful!"));
        console.log(chalk.gray("  Config saved to ~/.yunxiao/config.json"));
        console.log();
      } catch (err) {
        console.error(chalk.red("Error:"), err.message);
        process.exit(1);
      }
    });

  // auth status
  auth
    .command("status")
    .description("Show current authentication status")
    .action(() => {
      const config = loadSavedConfig();
      console.log(chalk.bold("\nAuthentication Status:\n"));
      if (!config || !config.pat) {
        console.log("  " + chalk.yellow("Not authenticated"));
        console.log("  " + chalk.gray("Run: yunxiao auth login"));
      } else {
        const maskedPat = config.pat.substring(0, 8) + "..." + config.pat.slice(-4);
        console.log("  " + chalk.gray("Status:  ") + chalk.green("Authenticated"));
        console.log("  " + chalk.gray("User:    ") + (config.userName || "-"));
        console.log("  " + chalk.gray("User ID: ") + (config.userId || "-"));
        console.log("  " + chalk.gray("Org:     ") + (config.orgName || "-"));
        console.log("  " + chalk.gray("Org ID:  ") + (config.orgId || "-"));
        console.log("  " + chalk.gray("PAT:     ") + maskedPat);
      }
      console.log();
    });

  // auth logout
  auth
    .command("logout")
    .description("Clear local authentication configuration")
    .action(() => {
      const config = loadSavedConfig();
      if (!config || !config.pat) {
        console.log(chalk.yellow("Not currently authenticated."));
        return;
      }
      clearConfig();
      console.log(chalk.green("✓ Logged out successfully."));
      console.log(chalk.gray("  Config cleared from ~/.yunxiao/config.json"));
      console.log();
    });
}
