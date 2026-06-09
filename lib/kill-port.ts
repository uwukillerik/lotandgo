import { execSync } from "node:child_process";

function findPidsOnPort(port: number): number[] {
  const pids = new Set<number>();

  if (process.platform === "win32") {
    try {
      const out = execSync(`netstat -ano | findstr ":${port}" | findstr "LISTENING"`, {
        encoding: "utf8",
        stdio: ["pipe", "pipe", "ignore"],
      });
      for (const line of out.split(/\r?\n/)) {
        const match = line.trim().match(/(\d+)\s*$/);
        if (match) pids.add(parseInt(match[1], 10));
      }
    } catch {
      // port free
    }
    return [...pids];
  }

  try {
    const out = execSync(`lsof -ti:${port} -sTCP:LISTEN`, {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "ignore"],
    });
    for (const line of out.split(/\r?\n/)) {
      const pid = parseInt(line.trim(), 10);
      if (!Number.isNaN(pid)) pids.add(pid);
    }
  } catch {
    // port free
  }
  return [...pids];
}

function killPid(pid: number): void {
  if (pid === process.pid || pid <= 0) return;
  try {
    if (process.platform === "win32") {
      execSync(`taskkill /PID ${pid} /F`, { stdio: "ignore" });
    } else {
      process.kill(pid, "SIGKILL");
    }
  } catch {
    // already gone
  }
}

export async function freePorts(ports: number[]): Promise<void> {
  const unique = [...new Set(ports.filter((p) => p > 0))];
  const killed: number[] = [];

  for (const port of unique) {
    for (const pid of findPidsOnPort(port)) {
      if (pid !== process.pid && !killed.includes(pid)) {
        killPid(pid);
        killed.push(pid);
      }
    }
  }

  if (killed.length > 0) {
    console.log(`Освобождены порты ${unique.join(", ")} (PID: ${killed.join(", ")})`);
    await new Promise((r) => setTimeout(r, 400));
  }
}
