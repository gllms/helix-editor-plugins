import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import warn from "./warn";

const IGNORE_REVS_FILE = ".git-blame-ignore-revs";

function git(...args: string[]) {
  return execFileSync("git", args, { encoding: "utf8" });
}

function readIgnoredRevs() {
  if (!existsSync(IGNORE_REVS_FILE)) return new Set<string>();

  const lines = readFileSync(IGNORE_REVS_FILE, "utf8").split("\n");
  return new Set(lines.map((line) => line.replace(/#.*/, "").trim()).filter(Boolean));
}

export default function getLastCommitDates(path: string): Map<string, Date> {
  const dates = new Map<string, Date>();
  const ignoredRevs = readIgnoredRevs();

  let log: string;
  try {
    if (git("rev-parse", "--is-shallow-repository").trim() === "true") {
      throw new Error("A shallow clone attributes every file to its oldest commit");
    }
    // The `--first-parent` flag makes sure we get the date of the merge commit, not the original commit
    log = git("log", "--first-parent", "--format=%x00%H%n%cI", "--name-only", "--", path);
  } catch (error) {
    warn(
      "Git history unavailable",
      `Couldn't tell when the files in ${path} last changed: ${error instanceof Error ? error.message : error}`,
    );
    return dates;
  }

  for (const commit of log.split("\0").slice(1)) {
    const [hash, date, ...files] = commit.trim().split(/\n+/);
    if (ignoredRevs.has(hash)) continue;

    for (const file of files) {
      if (!dates.has(file)) dates.set(file, new Date(date));
    }
  }

  return dates;
}
