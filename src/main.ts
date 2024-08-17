import * as github from "@actions/github";
import * as core from "@actions/core";
import { GitHub } from "@actions/github/lib/utils";
import { bumpVersionCode } from "./version-helper";
import { getHighestVersionTag, getGitLog, getGitSha } from "./git-helper";

export class Main {
  private client!: InstanceType<typeof GitHub>;
  private generateReleaseNotes = false;

  constructor() {
    this.initClient().catch((error) => {
      core.setFailed(`Initialization failed: ${error.message}`);
    });
  }

  public async initClient(): Promise<void> {
    try {
      const myToken = core.getInput("token");
      this.client = github.getOctokit(myToken);
    } catch (error: any) {
      throw new Error(
        `Could not initialize octokit, please make sure that you have provided the token and it's valid: ${error.message}`,
      );
    }
  }

  public async run(): Promise<void> {
    if (!process.env.GITHUB_WORKSPACE) {
      throw new Error(
        "GITHUB_WORKSPACE variable not defined, did you add the actions/checkout step?",
      );
    }

    this.generateReleaseNotes =
      core.getInput("generate-release-notes") === "true";

    const highestVersion = await getHighestVersionTag();
    const gitLog = await getGitLog(highestVersion, await getGitSha());
    const bumpedVersion = bumpVersionCode(highestVersion, gitLog);

    await this.deleteDraftReleases(bumpedVersion);
    const releaseId = await this.createDraftRelease(bumpedVersion, gitLog);

    core.setOutput("release-id", releaseId);
    core.setOutput("version", bumpedVersion);
    core.setOutput("raw-version", bumpedVersion.replace("v", ""));
  }

  private async listOpenDraftReleases(
    tag: string,
    page = 0,
  ): Promise<{ id: number }[]> {
    const result = await this.client.rest.repos.listReleases({
      repo: github.context.repo.repo,
      owner: github.context.repo.owner,
      per_page: 100,
      page,
    });

    const openDraftReleases = result.data.filter(
      (release) => release.draft && release.tag_name === tag,
    );

    if (result.data.length === 100) {
      const nextPageResults = await this.listOpenDraftReleases(tag, page + 1);
      return [...openDraftReleases, ...nextPageResults];
    }

    return openDraftReleases;
  }

  private async deleteDraftReleases(tag: string): Promise<void> {
    const openDraftReleases = await this.listOpenDraftReleases(tag);
    core.debug(
      `Found ${openDraftReleases.length} open draft releases for tag ${tag}`,
    );

    await Promise.all(
      openDraftReleases.map(async (release) => {
        core.debug(`Deleting existing draft release: ${release.id}`);
        return this.client.rest.repos.deleteRelease({
          release_id: release.id,
          repo: github.context.repo.repo,
          owner: github.context.repo.owner,
        });
      }),
    );
  }

  private async createDraftRelease(
    tag: string,
    changelog: string,
  ): Promise<number> {
    try {
      const release = await this.client.rest.repos.createRelease({
        tag_name: tag,
        target_commitish: await getGitSha(),
        generate_release_notes: this.generateReleaseNotes,
        repo: github.context.repo.repo,
        owner: github.context.repo.owner,
        body: this.generateReleaseNotes ? undefined : changelog,
        draft: true,
      });
      core.info(`Created new draft release: ${release.data.html_url}`);
      return release.data.id;
    } catch (error: any) {
      throw new Error(
        "Could not create release, please make sure that the token that was provided has enough permissions: " +
          error.message,
      );
    }
  }
}

export default new Main();
