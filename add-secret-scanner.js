import { Octokit } from "@octokit/rest";
import dotenv from "dotenv";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// GitHub token from environment variable
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
if (!GITHUB_TOKEN) {
    throw new Error("Please set GITHUB_TOKEN environment variable");
}

// Initialize Octokit
const octokit = new Octokit({
    auth: GITHUB_TOKEN
});

// Configuration
const BRANCH_PREFIX = "DOPS-12604/add-secret-scanner";
const PR_TITLE = "Add Secret Scanner Workflow";
const PR_BODY = `This PR adds the secret scanner workflow to the repository.

Changes:
- Added secret-scanner.yaml workflow file
- Configured to run on push and pull request events
- Uses the shared workflow from arbor-education/gha.workflows`;

// Workflow content
const WORKFLOW_CONTENT = `name: "Secret Scanner"
on:
  push:
  pull_request:

permissions:
  contents: read
  id-token: write
  issues: write
  pull-requests: write

jobs:
  secrets-scanner:
    uses: arbor-education/gha.workflows/.github/workflows/secret-scanner-template.yaml@DOPS-12604-cicd-scanner
    secrets:
      JIRA_TOKEN: \${{ secrets.JIRA_TOKEN }}
`;

async function createBranch(repo, defaultBranch) {
    try {
        // Get the latest commit SHA from the default branch
        const { data: refData } = await octokit.git.getRef({
            owner: repo.owner,
            repo: repo.name,
            ref: `heads/${defaultBranch}`
        });

        // Create new branch
        await octokit.git.createRef({
            owner: repo.owner,
            repo: repo.name,
            ref: `refs/heads/${BRANCH_PREFIX}`,
            sha: refData.object.sha
        });

        return true;
    } catch (error) {
        console.error(`❌ Error creating branch for ${repo.full_name}: ${error.message}`);
        return false;
    }
}

async function createOrUpdateWorkflow(repo) {
    try {
        // Check if .github/workflows directory exists
        try {
            await octokit.repos.getContent({
                owner: repo.owner,
                repo: repo.name,
                path: ".github/workflows",
                ref: BRANCH_PREFIX
            });
        } catch {
            // Create .github/workflows directory
            await octokit.repos.createOrUpdateFileContents({
                owner: repo.owner,
                repo: repo.name,
                path: ".github/workflows/.gitkeep",
                message: "Create workflows directory",
                content: Buffer.from("").toString("base64"),
                branch: BRANCH_PREFIX
            });
        }

        // Create or update the workflow file
        try {
            const { data: existingFile } = await octokit.repos.getContent({
                owner: repo.owner,
                repo: repo.name,
                path: ".github/workflows/secret-scanner.yaml",
                ref: BRANCH_PREFIX
            });

            // Update existing file
            await octokit.repos.createOrUpdateFileContents({
                owner: repo.owner,
                repo: repo.name,
                path: ".github/workflows/secret-scanner.yaml",
                message: "Update secret scanner workflow",
                content: Buffer.from(WORKFLOW_CONTENT).toString("base64"),
                sha: existingFile.sha,
                branch: BRANCH_PREFIX
            });
        } catch {
            // Create new file
            await octokit.repos.createOrUpdateFileContents({
                owner: repo.owner,
                repo: repo.name,
                path: ".github/workflows/secret-scanner.yaml",
                message: "Add secret scanner workflow",
                content: Buffer.from(WORKFLOW_CONTENT).toString("base64"),
                branch: BRANCH_PREFIX
            });
        }

        return true;
    } catch (error) {
        console.error(`❌ Error updating workflow for ${repo.full_name}: ${error.message}`);
        return false;
    }
}

async function createPullRequest(repo, defaultBranch) {
    try {
        await octokit.pulls.create({
            owner: repo.owner,
            repo: repo.name,
            title: PR_TITLE,
            body: PR_BODY,
            head: BRANCH_PREFIX,
            base: defaultBranch
        });
        return true;
    } catch (error) {
        console.error(`❌ Error creating PR for ${repo.full_name}: ${error.message}`);
        return false;
    }
}

async function processRepository(repoName) {
    try {
        const [owner, name] = repoName.split("/");
        const repo = { owner, name, full_name: repoName };

        // Get default branch
        const { data: repoData } = await octokit.repos.get({
            owner,
            repo: name
        });
        const defaultBranch = repoData.default_branch;

        console.log(`\nProcessing ${repoName}...`);

        // Create branch
        const branchCreated = await createBranch(repo, defaultBranch);
        if (!branchCreated) return;

        // Create/update workflow
        const workflowUpdated = await createOrUpdateWorkflow(repo);
        if (!workflowUpdated) return;

        // Create PR
        const prCreated = await createPullRequest(repo, defaultBranch);
        if (!prCreated) return;

        console.log(`✅ Successfully processed ${repoName}`);
    } catch (error) {
        console.error(`❌ Error processing ${repoName}: ${error.message}`);
    }
}

async function main() {
    // List of repository names to process
    const repos = [
        // Add your repository names here
        // Format: "owner/repo-name"
    ];

    console.log("Starting to process repositories...");
    
    for (const repo of repos) {
        await processRepository(repo);
    }

    console.log("\nFinished processing all repositories!");
}

main().catch(console.error); 