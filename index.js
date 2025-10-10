const core = require("@actions/core");
const trigger = require("./action");

async function run() {
  try {
    // Read inputs from GitHub Actions
    const params = {
      xcodeCloudWorkflowId: core.getInput("xcodeCloudWorkflowId"),
      gitBranchName: core.getInput("gitBranchName"),
    };

    // Run the trigger function
    await trigger(params);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
