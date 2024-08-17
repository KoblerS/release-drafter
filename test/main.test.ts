import main from "../src/main";
import * as core from "@actions/core";
import * as github from "@actions/github";

jest.mock("@actions/core");
jest.mock("@actions/github");

describe("initClient", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it("should initialize the client with the provided token", async () => {
    const myToken = "adalovelaceeatscookies";
    jest.spyOn(core, "getInput").mockReturnValue(myToken);
    const getOctokitMock = jest.spyOn(github, "getOctokit");

    await main.initClient();

    expect(core.getInput).toHaveBeenCalledWith("token");
    expect(getOctokitMock).toHaveBeenCalledWith(myToken);
  });

  it("should throw an error if failed to initialize the client", async () => {
    const errorMessage = "Failed to initialize octokit";
    jest.spyOn(core, "getInput").mockReturnValue("adalovelaceeatscookies");
    jest.spyOn(github, "getOctokit").mockImplementation(() => {
      throw new Error(errorMessage);
    });

    await expect(main.initClient()).rejects.toThrow(
      `Could not initialize octokit, please make sure that you have provided the token and it's valid: ${errorMessage}`,
    );
  });
});
