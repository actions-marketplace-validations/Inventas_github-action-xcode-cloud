const core = require("@actions/core");
const jwt = require("jsonwebtoken");

const { BASE_URL, REQUIRED_PARAMETERS } = require("./constants");
const AppStoreConnect = require("./app-store-connect");

/**
 * Read credentials from environment (GitHub Actions style INPUT_* or custom env).
 * These are used only if no token was provided directly via params.
 */
function readEnvCredentials() {
  const keyId = core.getInput("keyId");
  const issuerId = core.getInput("issuerId");
  const key = core.getInput("key");

  return { keyId, issuerId, key };
}

/**
 * Build an App Store Connect API JWT (ES256).
 * Inputs can come from env (typical for composite actions) or be passed directly.
 */
function generateAscJwt({ keyId, issuerId, privateKey }) {
  if (!keyId || !issuerId || !privateKey) {
    throw new Error(
      "Missing credentials to generate App Store Connect token. " +
        'Provide either params["appstore-connect-token"] or env/input keyId, issuerId, key.',
    );
  }

  // Normalize PEM with literal "\n" (as often stored in GitHub Secrets)
  const normalizedKey = privateKey.replace(/\\n/g, "\n");

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: issuerId,
    aud: "appstoreconnect-v1",
    iat: now,
    exp: now + 10 * 60, // 10 minutes
  };

  return jwt.sign(payload, normalizedKey, {
    algorithm: "ES256",
    keyid: keyId,
  });
}

async function retry(fn, { retries = 2, delayMs = 500 } = {}) {
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, delayMs));
      }
    }
  }
  throw lastErr;
}

module.exports = async function trigger(params) {
  try {
    // 1) Validate required parameters (from your constants module)
    for (const param of REQUIRED_PARAMETERS) {
      if (!params[param]) {
        throw new Error(`Required parameter '${param}' is not provided`);
      }
    }

    // 2) Acquire an App Store Connect token build one from the input
    const { keyId, issuerId, key } = readEnvCredentials();

    // Mask secrets in logs
    if (key) core.setSecret(key);

    const ascToken = generateAscJwt({ keyId, issuerId, privateKey: key });

    core.setSecret(ascToken);

    // 3) Initialize client
    const client = new AppStoreConnect(BASE_URL, ascToken);

    core.info("Getting workflow information…");
    const workflowId = params["xcodeCloudWorkflowId"];
    const workflowInfo = await client.getWorkflow(workflowId);

    core.info(
      `Using repository: ${workflowInfo.repository.owner}/${workflowInfo.repository.name}`,
    );

    // 4) Resolve git reference for the given branch (with a small retry)
    const branchName = params["gitBranchName"];
    core.info(`Finding git reference for branch '${branchName}'…`);

    const referenceId = await retry(
      () => client.getGitReference(workflowInfo.repository.id, branchName),
      { retries: 2, delayMs: 700 },
    );

    // 5) Trigger the build
    core.info("Starting Xcode Cloud build…");
    const { id: buildId, number: buildNumber } = await client.createBuild(
      workflowId,
      referenceId,
    );

    // 6) Report success
    core.info(
      `✅ Build successfully triggered: #${buildNumber} on ${workflowInfo.repository.name} (${branchName})`,
    );

    // 7) Set outputs for GitHub Actions
    core.setOutput("build_id", buildId);
    core.setOutput("build_number", buildNumber);
    core.setOutput("git_reference_id", referenceId);

    return {
      buildId,
      buildNumber,
      gitReferenceId: referenceId,
    };
  } catch (error) {
    // Provide clearer messaging while preserving original error for debugging
    core.setFailed(`❌ ${error.message}`);
    throw error;
  }
};
