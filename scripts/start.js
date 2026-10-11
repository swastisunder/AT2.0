import { spawn } from "node:child_process";
import path from "node:path";
import process from "node:process";

const rootDir = process.cwd();
const isWin = process.platform === "win32";
const npmCmd = isWin ? "npm.cmd" : "npm";

console.log("\x1b[36m%s\x1b[0m", "[Start] Starting AtomicTask 2.0 Server...");

const serverProc = spawn(npmCmd, ["start"], {
  cwd: path.join(rootDir, "server"),
  stdio: "inherit",
  shell: true,
});

process.on("SIGINT", () => {
  if (isWin && serverProc.pid) {
    spawn("taskkill", ["/pid", String(serverProc.pid), "/T", "/F"], { stdio: "ignore" });
  } else {
    serverProc.kill("SIGINT");
  }
  process.exit(0);
});

serverProc.on("exit", (code) => {
  process.exit(code || 0);
});

