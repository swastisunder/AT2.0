import { spawn } from "node:child_process";
import path from "node:path";
import process from "node:process";

const rootDir = process.cwd();
const isWin = process.platform === "win32";
const npmCmd = isWin ? "npm.cmd" : "npm";

console.log("\x1b[36m%s\x1b[0m", "[Dev] Starting AtomicTask 2.0 (Server + Client)...");

const serverProc = spawn(npmCmd, ["run", "dev"], {
  cwd: path.join(rootDir, "server"),
  stdio: "inherit",
  shell: true,
});

const clientProc = spawn(npmCmd, ["run", "dev"], {
  cwd: path.join(rootDir, "client"),
  stdio: "inherit",
  shell: true,
});

let isCleaningUp = false;
const cleanup = () => {
  if (isCleaningUp) return;
  isCleaningUp = true;
  console.log("\n\x1b[33m%s\x1b[0m", "[Dev] Shutting down services...");
  if (isWin) {
    if (serverProc.pid) spawn("taskkill", ["/pid", String(serverProc.pid), "/T", "/F"], { stdio: "ignore" });
    if (clientProc.pid) spawn("taskkill", ["/pid", String(clientProc.pid), "/T", "/F"], { stdio: "ignore" });
  } else {
    serverProc.kill("SIGTERM");
    clientProc.kill("SIGTERM");
  }
  process.exit(0);
};

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);

serverProc.on("exit", (code) => {
  if (code && code !== 0 && !isCleaningUp) {
    console.error(`[Dev] Server exited with code ${code}`);
  }
});

clientProc.on("exit", (code) => {
  if (code && code !== 0 && !isCleaningUp) {
    console.error(`[Dev] Client exited with code ${code}`);
  }
});

