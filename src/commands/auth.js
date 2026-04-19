// src/commands/auth.js - yunxiao auth login/status/logout
import readline from "readline";
import chalk from "chalk";
import { createClientWithPat } from "../api.js";
import { loadSavedConfig, saveConfig, clearConfig } from "../config.js";
import { t, tx } from "../i18n/index.js";

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
    process.stdout.write(question);

    if (!process.stdin.isTTY) {
      // Non-interactive (pipe/redirect): read a line without echo suppression
      const rl = readline.createInterface({ input: process.stdin });
      rl.once("line", (answer) => {
        rl.close();
        resolve(answer);
      });
      return;
    }

    process.stdin.setRawMode(true);
    process.stdin.resume();

    let input = "";
    const onData = (buf) => {
      const ch = buf.toString("utf8");
      if (ch === "\r" || ch === "\n") {
        process.stdout.write("\n");
        process.stdin.setRawMode(false);
        process.stdin.pause();
        process.stdin.removeListener("data", onData);
        resolve(input);
      } else if (ch === "\u0003") {
        // Ctrl-C
        process.stdout.write("\n");
        process.stdin.setRawMode(false);
        process.stdin.pause();
        process.stdin.removeListener("data", onData);
        process.exit(1);
      } else if (ch === "\u007f" || ch === "\b") {
        // Backspace/Delete
        input = input.slice(0, -1);
      } else if (ch.charCodeAt(0) >= 32) {
        input += ch;
      }
    };

    process.stdin.on("data", onData);
  });
}

export function registerAuthCommands(program, deps = {}) {
  const {
    createClientWithPat: createClient = createClientWithPat,
    loadSavedConfig: loadConfig = loadSavedConfig,
    saveConfig: persistConfig = saveConfig,
    clearConfig: clearSavedConfig = clearConfig,
    prompt: promptInput = prompt,
    promptSecret: promptSecretInput = promptSecret,
  } = deps;

  const auth = program.command("auth").description("Manage authentication");

  // auth login
  auth
    .command("login")
    .description("Authenticate with Yunxiao using a Personal Access Token")
    .option("--token <token>", "Personal Access Token (non-interactive mode)")
    .option("--org-id <orgId>", "Organization ID (non-interactive mode)")
    .action(async (options) => {
      try {
        // Non-interactive mode: both --token and --org-id provided
        if (options.token && options.orgId) {
          persistConfig({
            token: options.token.trim(),
            orgId: options.orgId.trim(),
          });
          console.log(chalk.green(`✓ ${t("commands.auth.login.success", "Login successful!")}`));
          console.log(chalk.gray(`  ${t("commands.auth.configSaved", "Config saved to ~/.yunxiao/config.json")}`));
          console.log();
          return;
        }

        // Interactive mode
        console.log(chalk.bold(`\n${t("commands.auth.login.title", "Yunxiao Authentication")}\n`));
        console.log(
          chalk.gray(
            `${tx(
              "commands.auth.login.patHelp",
              "Generate a PAT at: {url}",
              { url: "https://account-devops.aliyun.com/settings/personalAccessToken" }
            )}\n`
          )
        );

        let pat = options.token ? options.token.trim() : "";
        if (!pat) {
          pat = (await promptSecretInput(t("commands.auth.login.prompt", "Paste your Personal Access Token: "))).trim();
          if (!pat) {
            console.error(chalk.red(t("errors.auth.emptyPat", "PAT cannot be empty")));
            process.exit(1);
          }
        }

        // Verify PAT by fetching current user
        process.stdout.write(chalk.gray(`\n${t("commands.auth.login.verifyingPat", "Verifying PAT...")} `));
        const client = createClient(pat);
        let user;
        try {
          const res = await client.get("/oapi/v1/platform/user");
          user = res.data;
          console.log(chalk.green("✓"));
        } catch (err) {
          console.log(chalk.red("✗"));
          if (err.response?.status === 401 || err.response?.status === 403) {
            console.error(chalk.red(t("errors.auth.invalidPat", "Invalid PAT. Please check and try again.")));
          } else {
            console.error(
              chalk.red(t("errors.auth.verifyPatFailed", "Failed to verify PAT:")),
              err.response?.data?.errorMessage || err.message
            );
          }
          process.exit(1);
        }

        console.log(
          chalk.green("✓ ") +
            tx("commands.auth.login.authenticatedAs", "Authenticated as {name}", {
              name: chalk.bold(user.name || user.id),
            })
        );

        let orgId = options.orgId ? options.orgId.trim() : "";
        let selectedOrg;

        if (orgId) {
          // org-id provided via flag; skip interactive org selection
          selectedOrg = { id: orgId, name: null };
        } else {
          // Fetch organizations interactively
          process.stdout.write(chalk.gray(`${t("commands.auth.login.fetchingOrgs", "Fetching organizations...")} `));
          let orgs;
          try {
            const res = await client.get("/oapi/v1/platform/organizations");
            orgs = res.data;
            console.log(chalk.green("✓"));
          } catch (err) {
            console.log(chalk.red("✗"));
            console.error(
              chalk.red(t("errors.auth.fetchOrgsFailed", "Failed to fetch organizations:")),
              err.response?.data?.errorMessage || err.message
            );
            process.exit(1);
          }

          if (!orgs || orgs.length === 0) {
            console.error(chalk.red(t("errors.auth.noOrganizations", "No organizations found for this account.")));
            process.exit(1);
          }

          if (orgs.length === 1) {
            selectedOrg = orgs[0];
            console.log(
              chalk.green("✓ ") +
                tx("commands.auth.login.organizationSelected", "Organization: {name}", {
                  name: chalk.bold(selectedOrg.name),
                })
            );
          } else {
            console.log(chalk.bold(`\n${t("commands.auth.login.selectOrg", "Select an organization:")}\n`));
            orgs.forEach((org, i) => {
              console.log(`  ${chalk.cyan((i + 1) + ".")} ${org.name} ${chalk.gray("(" + org.id + ")")}`);
            });
            console.log();
            const choice = await promptInput(t("commands.auth.login.enterOrgNumber", "Enter number [1]: "));
            const idx = choice.trim() === "" ? 0 : parseInt(choice.trim(), 10) - 1;
            if (isNaN(idx) || idx < 0 || idx >= orgs.length) {
              console.error(chalk.red(t("errors.validation.invalidSelection", "Invalid selection.")));
              process.exit(1);
            }
            selectedOrg = orgs[idx];
          }
        }

        persistConfig({
          token: pat,
          userId: user.id,
          userName: user.name || null,
          orgId: selectedOrg.id,
          orgName: selectedOrg.name || null,
        });

        console.log();
        console.log(chalk.green(`✓ ${t("commands.auth.login.success", "Login successful!")}`));
        console.log(chalk.gray(`  ${t("commands.auth.configSaved", "Config saved to ~/.yunxiao/config.json")}`));
        console.log();
      } catch (err) {
        console.error(chalk.red(t("commands.common.errorPrefix", "Error:")), err.message);
        process.exit(1);
      }
    });

  // auth status
  auth
    .command("status")
    .description("Show current authentication status")
    .action(() => {
      const config = loadConfig();
      console.log(chalk.bold(`\n${t("commands.auth.status.title", "Authentication Status:")}\n`));
      const token = config?.token || config?.pat;
      if (!config || !token) {
        console.log("  " + chalk.yellow(t("commands.auth.status.notAuthenticated", "Not authenticated")));
        console.log("  " + chalk.gray(t("commands.auth.status.runLogin", "Run: yunxiao auth login")));
      } else {
        const maskedPat = "*****" + token.slice(-4);
        console.log(`  ${chalk.gray(t("commands.auth.status.statusLabel", "Status:"))} ${chalk.green(t("commands.auth.status.authenticated", "Authenticated"))}`);
        console.log(`  ${chalk.gray(t("commands.auth.status.userLabel", "User:"))} ${config.userName || "-"}`);
        console.log(`  ${chalk.gray(t("commands.auth.status.userIdLabel", "User ID:"))} ${config.userId || "-"}`);
        console.log(`  ${chalk.gray(t("commands.auth.status.orgLabel", "Org:"))} ${config.orgName || "-"}`);
        console.log(`  ${chalk.gray(t("commands.auth.status.orgIdLabel", "Org ID:"))} ${config.orgId || "-"}`);
        console.log(`  ${chalk.gray(t("commands.auth.status.patLabel", "PAT:"))} ${maskedPat}`);
      }
      console.log();
    });

  // auth logout
  auth
    .command("logout")
    .description("Clear local authentication configuration")
    .action(() => {
      const config = loadConfig();
      if (!config || !(config.token || config.pat)) {
        console.log(chalk.yellow(t("commands.auth.logout.notAuthenticated", "Not currently authenticated.")));
        return;
      }
      clearSavedConfig();
      console.log(chalk.green(`✓ ${t("commands.auth.logout.success", "Logged out successfully.")}`));
      console.log(chalk.gray(`  ${t("commands.auth.configCleared", "Config cleared from ~/.yunxiao/config.json")}`));
      console.log();
    });
}
