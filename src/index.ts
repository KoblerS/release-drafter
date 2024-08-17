/**
 * The entrypoint for the action.
 */
import * as core from "@actions/core";
import Main from "./main";

Main.run().catch((error) => core.setFailed(error));
