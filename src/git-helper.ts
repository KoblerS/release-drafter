import * as core from "@actions/core";
import * as exec from "@actions/exec";

/**
 * Fetches all tags from the remote repository.
 */
async function fetchTags(): Promise<void> {
  // TODO: --depth=9999999 is a workaround for shallow clones, remove when fixed
  await exec.exec("git", ["fetch", "--tags", "--depth=9999999", "--force"]);
}

/**
 * @returns highest version tag or null if none exists
 */
export async function getHighestVersionTag(): Promise<string | null> {
  await fetchTags();

  const versionPrefix = core.getInput("version-prefix");
  const tags = await exec.getExecOutput("git", [
    "tag",
    "--list",
    `${versionPrefix}*`,
    "--sort=-v:refname",
  ]);

  const semverRegex = /^.*?(\d+\.\d+\.\d+)(-.+)?$/;

  const version = tags.stdout.split("\n")[0];
  core.debug(
    `Testing version tags: ${tags.stdout} - ${version} result: ${semverRegex.test(version)}`,
  );

  if (!version || !semverRegex.test(version)) {
    core.info("No highest version found, this is the first release");
    return null;
  }

  core.info(`Found current highest version: ${version}`);
  return version;
}

/**
 * @returns current git sha
 */
export async function getGitSha(): Promise<string> {
  const result = await exec.getExecOutput("git", ["rev-parse", "HEAD"]);
  return result.stdout.trim();
}

/**
 * @param rangeStart commit from where to start the git log, defaults to showing the entire history if not provided
 * @param rangeEnd commit where to end the git log
 * @returns git log between in the given range
 */
export async function getGitLog(
  rangeStart: string | null,
  rangeEnd: string,
): Promise<string> {
  const range = rangeStart ? `${rangeStart}..${rangeEnd}` : rangeEnd;
  const result = await exec.getExecOutput("git", ["log", "--format=%B", range]);

  if (result.exitCode === 0) {
    return result.stdout;
  } else {
    core.error(`Failed to get git log: ${result.stderr}`);
    return "";
  }
}
