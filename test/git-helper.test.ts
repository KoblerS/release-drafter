import { getHighestVersionTag, getGitLog } from "../src/git-helper";
import * as exec from "@actions/exec";

describe("getHighestVersionTag", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it("should return null if no tags are found", async () => {
    jest.spyOn(exec, "exec").mockResolvedValueOnce(0);
    jest
      .spyOn(exec, "getExecOutput")
      .mockResolvedValueOnce({ exitCode: 0, stdout: "", stderr: "" });

    const result = await getHighestVersionTag();
    expect(result).toBeNull();
  });

  it("should return the highest version tag", async () => {
    jest.spyOn(exec, "exec").mockResolvedValueOnce(0);
    jest
      .spyOn(exec, "getExecOutput")
      .mockResolvedValueOnce({ exitCode: 0, stdout: "v1.2.3", stderr: "" });

    const result = await getHighestVersionTag();
    expect(result).toBe("v1.2.3");
  });

  it("should startover with a fresh version", async () => {
    jest.spyOn(exec, "exec").mockResolvedValueOnce(0);
    jest
      .spyOn(exec, "getExecOutput")
      .mockResolvedValueOnce({ exitCode: 0, stdout: "v1", stderr: "" });

    const result = await getHighestVersionTag();
    expect(result).toBe(null);
  });
});

describe("getGitLog", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it("should return the git log for the provided range", async () => {
    let actualArgs;
    jest
      .spyOn(exec, "getExecOutput")
      .mockImplementationOnce(async (_, args) => {
        actualArgs = args;
        return {
          exitCode: 0,
          stdout: "commit message 1\ncommit message 2\ncommit message 3",
          stderr: "",
        };
      });

    const result = await getGitLog("abcd", "efgh");
    expect(result).toBe("commit message 1\ncommit message 2\ncommit message 3");
    expect(actualArgs).toEqual(["log", "--format=%B", "abcd..efgh"]);
  });

  it("should return the entire git log when range start is missing", async () => {
    let actualArgs;
    jest
      .spyOn(exec, "getExecOutput")
      .mockImplementationOnce(async (_, args) => {
        actualArgs = args;
        return {
          exitCode: 0,
          stdout: "commit message 1\ncommit message 2\ncommit message 3",
          stderr: "",
        };
      });

    const result = await getGitLog(null, "efgh");
    expect(result).toBe("commit message 1\ncommit message 2\ncommit message 3");
    expect(actualArgs).toEqual(["log", "--format=%B", "efgh"]);
  });
});
