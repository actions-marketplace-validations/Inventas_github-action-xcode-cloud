# GitHub Action Xcode Cloud

A GitHub Action that triggers Xcode Cloud workflows from your CI/CD pipeline. This action allows you to start Xcode Cloud builds programmatically using the App Store Connect API.

## Features

- Trigger Xcode Cloud workflows from GitHub Actions from any Git branch
- Outputs build information for further processing

## Usage

### Basic Example

```yaml
name: Trigger Xcode Cloud Build

on:
  push:
    branches: [main]

jobs:
  trigger-build:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Xcode Cloud
        id: xcode-cloud
        uses: inventas/github-action-xcode-cloud@v1
        with:
          keyId: ${{ secrets.APP_STORE_CONNECT_KEY_ID }}
          key: ${{ secrets.APP_STORE_CONNECT_PRIVATE_KEY }}
          issuerId: ${{ secrets.APP_STORE_CONNECT_ISSUER_ID }} # Leave out for Individual App Store Connect API Keys
          xcodeCloudWorkflowId: ${{ secrets.XCODE_CLOUD_WORKFLOW_ID }}
          gitBranchName: main

      - name: Print build info
        run: |
          echo "Build Number: ${{ steps.xcode-cloud.outputs.buildNumber }}"
          echo "Build ID: ${{ steps.xcode-cloud.outputs.buildId }}"
          echo "Git Reference ID: ${{ steps.xcode-cloud.outputs.gitReferenceId }}"
```

### Conditional Trigger

```yaml
- name: Trigger Xcode Cloud on release
  if: startsWith(github.ref, 'refs/tags/')
  uses: inventas/github-action-xcode-cloud@v1
  with:
    keyId: ${{ secrets.APP_STORE_CONNECT_KEY_ID }}
    key: ${{ secrets.APP_STORE_CONNECT_PRIVATE_KEY }}
    issuerId: ${{ secrets.APP_STORE_CONNECT_ISSUER_ID }} # Leave out for Individual App Store Connect API Keys
    xcodeCloudWorkflowId: ${{ secrets.XCODE_CLOUD_WORKFLOW_ID }}
    gitBranchName: ${{ github.ref_name }}
```

## Inputs

| Input | Description | Required | Example |
|-------|-------------|----------|---------|
| `keyId` | App Store Connect API Key ID | ✅ | `ABC1234DEF` |
| `key` | App Store Connect Private Key (P8) | ✅ | `-----BEGIN PRIVATE KEY-----\n...` |
| `issuerId` | App Store Connect Issuer ID (Leave out for Individual App Store Connect API Keys) | ✅ | `12345678-1234-1234-1234-123456789012` |
| `xcodeCloudWorkflowId` | Xcode Cloud Workflow ID | ✅ | `12345678-1234-1234-1234-123456789012` |
| `gitBranchName` | Git branch name to trigger build on | ✅ | `main`, `develop`, `feature/new-feature` |

## Outputs

| Output | Description | Example |
|--------|-------------|---------|
| `buildNumber` | The build number assigned by Xcode Cloud | `42` |
| `buildId` | The unique build ID | `12345678-1234-1234-1234-123456789012` |
| `gitReferenceId` | The Git reference ID used for the build | `87654321-4321-4321-4321-210987654321` |

## How to Obtain Required Inputs

### 1. App Store Connect API Credentials

You need to create an App Store Connect API key with appropriate permissions:

1. **Sign in to App Store Connect**
   - Go to [App Store Connect](https://appstoreconnect.apple.com/)
   - Sign in with your Apple Developer account

2. **Create API Key**
   - Navigate to **Users and Access** > **Integrations** > **App Store Connect API**
   - Click **Generate API Key**
   - Enter a name for your key (e.g., "GitHub Actions Xcode Cloud")
   - Select role: **Developer** (minimum required)
   - Click **Generate**

3. **Download and Store Credentials**
   - **Key ID**: Copy the Key ID (e.g., `ABC1234DEF`)
   - **Issuer ID**: Copy the Issuer ID (UUID format). Leave out for Individual App Store Connect API Keys.
   - **Private Key**: Download the `.p8` file and copy its contents
   - **Important**: Store these securely as GitHub secrets immediately

### 2. Xcode Cloud Workflow ID

1. **Open App Store Connect**
   - Navigate to your app
   - Go to **Xcode Cloud** tab

2. **Find Workflow ID**
   - Click on the workflow you want to trigger
   - Look at the URL in your browser:
     ```
     https://appstoreconnect.apple.com/teams/{team-id}/apps/{app-id}/ci/workflows/{workflow-id}
     ```
   - Copy the `{workflow-id}` part (UUID format)

### 3. Setting Up GitHub Secrets

Add these secrets to your GitHub repository:

1. Go to your repository → **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret** and add:
   - `APP_STORE_CONNECT_KEY_ID`: Your Key ID
   - `APP_STORE_CONNECT_ISSUER_ID`: Your Issuer ID
   - `APP_STORE_CONNECT_PRIVATE_KEY`: Your private key content (including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`)
   - `XCODE_CLOUD_WORKFLOW_ID`: Your workflow ID

## Requirements

- Your repository must be connected to Xcode Cloud
- The specified branch must exist in your repository
- App Store Connect API key must have appropriate permissions
- Xcode Cloud workflow must be properly configured

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Development

### Building the Action

This action uses [@vercel/ncc](https://github.com/vercel/ncc) to bundle the Node.js application and dependencies into a single file.

#### Prerequisites

- Node.js (version 24 or later)
- npm

#### Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

#### Building

To build the action after making changes:

```bash
npm run build
```

This creates a bundled file at `dist/index.js` which includes all dependencies.

#### Important Notes

- The `dist/` folder **must be committed** to the repository for GitHub Actions to work
- Always run `npm run build` after making code changes
- The bundled `dist/index.js` file is what GitHub Actions actually executes

## Credits

This action builds upon work from [yorifuji/actions-xcode-cloud-dispatcher](https://github.com/yorifuji/actions-xcode-cloud-dispatcher) licensed under the MIT License.
