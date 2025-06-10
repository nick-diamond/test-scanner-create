# GitHub Secret Scanner Workflow Adder

This script helps you add the secret scanner workflow to multiple GitHub repositories by creating feature branches and pull requests.

## Features

- Creates a feature branch for each repository
- Adds or updates the secret scanner workflow file
- Creates a pull request with descriptive title and body
- Handles errors gracefully and provides status updates
- Uses the JIRA ticket number in branch names (DOPS-12604)

## Prerequisites

- Node.js 14 or higher
- GitHub Personal Access Token with appropriate permissions (repo access)

## Setup

1. Install the required dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file in the same directory with your GitHub token:
   ```
   GITHUB_TOKEN=your_github_token_here
   ```

3. Edit the `add-secret-scanner.js` file and add your repository names to the `repos` array in the `main()` function:
   ```javascript
   const repos = [
       "owner/repo1",
       "owner/repo2",
       // Add more repositories here
   ];
   ```

## Usage

Run the script:
```bash
npm start
```

The script will for each repository:
1. Create a new branch named `DOPS-12604/add-secret-scanner`
2. Create the `.github/workflows` directory if it doesn't exist
3. Add or update the `secret-scanner.yaml` workflow file
4. Create a pull request to merge the changes
5. Print the status of each operation

## Error Handling

- The script will continue processing repositories even if one fails
- Errors are logged with the repository name and error message
- Success messages are shown with a ✅ emoji
- Error messages are shown with a ❌ emoji

## Pull Request Details

Each pull request will have:
- Title: "Add Secret Scanner Workflow"
- Description of changes
- Branch name format: `DOPS-12604/add-secret-scanner` 