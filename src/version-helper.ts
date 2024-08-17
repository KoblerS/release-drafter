import * as core from "@actions/core";

const VERSION_MAJOR = "major";
const VERSION_MINOR = "minor";
const VERSION_PATCH = "patch";
type VersionIncrement = "major" | "minor" | "patch";

const TYPE_MAP = {
  fix: VERSION_PATCH,
  build: VERSION_PATCH,
  chore: VERSION_PATCH,
  ci: VERSION_PATCH,
  docs: VERSION_PATCH,
  style: VERSION_PATCH,
  refactor: VERSION_PATCH,
  perf: VERSION_PATCH,
  test: VERSION_PATCH,
  feat: VERSION_MINOR,
  major: VERSION_MAJOR,
};

/**
 * @returns highest version increment based on the keyword(s) found in the commit messages
 */
function getIncrementType(gitLog: string): VersionIncrement {
  let increment: VersionIncrement = VERSION_PATCH;

  const commitList = gitLog.split("\n").map((line) => line.trimStart());
  for (const commit of commitList) {
    // If the commit message starts with 'BREAKING CHANGE:', it's a major change
    if (commit.startsWith("BREAKING CHANGE:")) {
      return VERSION_MAJOR;
    }

    // If the commit message starts with a known keyword + exclamation mark, it's a major change
    // See https://www.conventionalcommits.org/en/v1.0.0/#commit-message-with--to-draw-attention-to-breaking-change
    for (const type of Object.keys(TYPE_MAP)) {
      if (commit.startsWith(`${type}!`)) {
        return VERSION_MAJOR;
      }
    }

    // Skip if the current increment value is already 'minor', since we'd then be only
    // looking for major changes as a higher increment.
    if (increment === VERSION_MINOR) {
      continue;
    }

    // Find the versioning keyword that matches the commit message
    const commitType = Object.keys(TYPE_MAP).find((prefix) =>
      commit.startsWith(prefix),
    );

    // If a known keyword is found, update the increment value
    if (commitType) {
      increment = TYPE_MAP[commitType];
    }

    // Skip continue looking if we already found a major change
    if (increment === VERSION_MAJOR) {
      return VERSION_MAJOR;
    }
  }

  return increment;
}

/**
 * @param currentVersion input of the current highest version tag
 * @param increment specify the version increment, e.g. patch, minor, major
 * @returns new version bumbed up
 */
export function bumpVersionCode(
  currentVersion: string | null,
  gitlog: string,
): string {
  const versionPrefix = core.getInput("version-prefix");

  // First release, so it defaults to v1.0.0
  if (!currentVersion) {
    core.info(`This is the first release, starting at ${versionPrefix}1.0.0`);
    return `${versionPrefix}1.0.0`;
  }

  // Extract version number:
  // - v1.0.0 -> 1.0.0
  // - v1.0.0+rc.1 -> 1.0.0
  const [major, minor, patch] = currentVersion
    .replace(/^(?:\w*[^0-9])?(\d+\.\d+\.\d+).*$/, "$1")
    .split(".")
    .map(Number);

  // Calculate the new version based on commit messages since the last version
  const incrementType = getIncrementType(gitlog);
  let newVersion: string;
  if (incrementType === VERSION_MAJOR) {
    newVersion = `${versionPrefix}${major + 1}.0.0`;
  } else if (incrementType === VERSION_MINOR) {
    newVersion = `${versionPrefix}${major}.${minor + 1}.0`;
  } else {
    newVersion = `${versionPrefix}${major}.${minor}.${patch + 1}`;
  }
  core.info(
    `Recommended GitHub commit type: ${incrementType}, this would bump the version from ${currentVersion} to ${newVersion}`,
  );
  return newVersion;
}
