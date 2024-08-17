import { bumpVersionCode } from "../src/version-helper";
import * as core from "@actions/core";

describe("bumpVersionCode", () => {
  it("should bump patch level with an empty git log", () => {
    jest.spyOn(core, "getInput").mockReturnValue("v");
    const result = bumpVersionCode("v1.2.3", "");
    expect(result).toBe("v1.2.4");
  });

  it("should bump patch level with an empty git log and leave out the version prefix", () => {
    jest.spyOn(core, "getInput").mockReturnValue("");
    const result = bumpVersionCode("1.2.3", "");
    expect(result).toBe("1.2.4");
  });

  it("should bump patch level when version had a prefix before", () => {
    jest.spyOn(core, "getInput").mockReturnValue("");
    const result = bumpVersionCode("v1.2.3", "");
    expect(result).toBe("1.2.4");
  });

  test.each([
    ["v1.2.3", "v1.2.4"],
    ["v1.2.3+rc.1", "v1.2.4"],
    ["v1.2.3-rc.1", "v1.2.4"],
    ["v1.2.3-rc.1+build.2", "v1.2.4"],
  ])("should bump the patch version", (currentVersion, expected) => {
    jest.spyOn(core, "getInput").mockReturnValue("v");
    const result = bumpVersionCode(
      currentVersion,
      createGitLog(["fix: fix a bug"]),
    );
    expect(result).toBe(expected);
  });

  test.each([
    "fix",
    "build",
    "chore",
    "ci",
    "docs",
    "style",
    "refactor",
    "perf",
    "test",
  ])("should bump the patch version for %p", async (type) => {
    jest.spyOn(core, "getInput").mockReturnValue("v");
    const gitlog = createGitLog([`${type}: abcde 1`, "Initial commit"]);
    const result = bumpVersionCode("v1.2.3", gitlog);
    expect(result).toBe("v1.2.4");
  });

  // Only one test is needed for minor, since they only have one key word
  test.each([
    ["v1.2.3", "v1.3.0"],
    ["v1.2.3+rc.1", "v1.3.0"],
    ["v1.2.3-rc.1", "v1.3.0"],
    ["v1.2.3-rc.1+build.2", "v1.3.0"],
  ])("should bump the minor version", (currentVersion, expected) => {
    jest.spyOn(core, "getInput").mockReturnValue("v");
    const gitlog = createGitLog(["feat: add new feature", "Initial commit"]);
    const result = bumpVersionCode(currentVersion, gitlog);
    expect(result).toBe(expected);
  });

  test.each([
    ["v1.2.3", "v2.0.0"],
    ["v1.2.3+rc.1", "v2.0.0"],
    ["v1.2.3-rc.1", "v2.0.0"],
    ["v1.2.3-rc.1+build.2", "v2.0.0"],
  ])("should bump the major version", (currentVersion, expected) => {
    jest.spyOn(core, "getInput").mockReturnValue("v");
    const gitlog = createGitLog(["major: add new feature", "Initial commit"]);
    const result = bumpVersionCode(currentVersion, gitlog);
    expect(result).toBe(expected);
  });

  test.each(["major", "BREAKING CHANGE"])(
    "should bump the patch version for %p",
    async (type) => {
      jest.spyOn(core, "getInput").mockReturnValue("v");
      const gitlog = createGitLog([`${type}: abcde 1`, "Initial commit"]);
      const result = bumpVersionCode("v1.2.3", gitlog);
      expect(result).toBe("v2.0.0");
    },
  );
});

function createGitLog(messages: string[]) {
  // Indents each line of each message, which is how git-log renders the commit message
  const indentMessage = (message: string) =>
    message
      .split("\n")
      .map((line) => `    ${line}`)
      .join("\n");

  const addCommitHeader = (message: string) => `
  commit ${Math.random().toString(2).substring(2)}
  Author: Ada Lovelace <alovelace@wlgore.com>
  Date:  Thu Jan 1 00:00:00 1970 +0000
  
  ${message}
  `;

  return messages.map(indentMessage).map(addCommitHeader).join("\n");
}
