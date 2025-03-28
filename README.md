# GuiltLab

GuiltLab is a Next.js application that aggregates and visualizes your contributions across multiple GitLab and GitHub instances. See all your contributions in one place with a unified heatmap and leaderboard.

## Features

- Connect to multiple GitLab and GitHub instances using personal access tokens
- View an aggregated heatmap of your contributions across all instances
- See a leaderboard of contributions
- Secure storage of your repository instance configurations in your browser's localStorage

## Getting Started

### Prerequisites

- Node.js 16.8.0 or later
- npm or yarn

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/guiltlab.git
cd guiltlab
```

2. Install dependencies:

```bash
npm install -g npm@latest
# or
yarn install
```

3. Start the development server:

```bash
npm run dev
# or
yarn dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser to see the app.

## Usage

1. Add your GitLab instances using the form on the left side.
   - You'll need to provide a name for the instance, the base URL (e.g., `https://gitlab.com`), and a personal access token.
   - The token should have `read_user`, `read_api`, and `read_repository` scopes.
   - **Important:** The `read_repository` scope is critical for accessing historical contribution data (older than 1 year).

2. Add your GitHub instances using the GitHub form.
   - You'll need to provide a name for the instance, your GitHub username, and a personal access token.
   - The token should have `read:user` scope.

3. Once you've added your instances, the heatmap and leaderboard will automatically populate with your aggregated contribution data.

4. Hover over the heatmap cells to see details about your contributions for each day, including breakdowns by instance.

## Security

Your GitLab personal access tokens are stored only in your browser's localStorage and are never sent to any server except the GitLab instances you configure. All API requests to GitLab are proxied through a serverless function to avoid CORS issues.

## Building for Production

To create a production build:

```bash
npm run build
# or
yarn build
```

Then, you can start the production server:

```bash
npm start
# or
yarn start
```

## Deployment

### Docker Deployment

This application can be built and run as a Docker container:

```bash
# Build the Docker image
docker build -t guiltlab:latest .

# Run the container
docker run -p 3000:3000 guiltlab:latest
```

### Kubernetes Deployment

The application includes Kubernetes manifests in the `k8s/` directory for manual deployment to a Kubernetes cluster:

```bash
# Apply the Kubernetes manifests
kubectl apply -f k8s/deployment.yaml
```

Remember to update the `guiltlab.example.com` hostname in the Ingress resource to your actual domain and to replace the image reference in the deployment.yaml file with your actual image:

```
# Update the image in deployment.yaml before applying
sed -i 's|ghcr.io/USERNAME/guiltlab:VERSION|ghcr.io/yourusername/guiltlab:latest|g' k8s/deployment.yaml
```

### Continuous Integration

The project is configured with GitHub Actions workflows for:

1. **Building and Publishing Docker Images**: When pushing to the main branch or tagging a release (with `v*` pattern), a Docker image is automatically built and published to GitHub Container Registry.

2. **Release Management**: The project uses semantic-release for versioning and creating GitHub releases.

#### Creating Releases

To create a new release:

1. **Automatic Release**: Make commits with conventional commit messages (e.g., `feat: add new feature`, `fix: resolve bug`). The semantic-release action will automatically determine the version bump based on your commits.

2. **Manual Release**: Use the "Create Release" workflow through the GitHub Actions UI, selecting the version bump type (patch, minor, major).

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Code Quality and Linting

### Fixing Linting Errors

The project uses ESLint and TypeScript for code quality checks. If you encounter linting errors, you can use the following scripts to fix them:

```bash
# Run the linter and see all errors
npm run lint

# Automatically fix linting errors where possible
npm run lint:fix

# Fix common TypeScript errors (any types, unused vars) across all files
npm run fix:types

# Fix the specific errors that were found during build
npm run fix:specific
```

#### Common Linting Issues

1. **Unused imports/variables**: The linter will flag imports or variables that are defined but never used. Either remove them or prefix with underscore (`_`) to indicate they're intentionally unused.

2. **`any` types**: TypeScript discourages using the `any` type. Replace with more specific types when possible, or use `unknown` if the exact type isn't known.

3. **Image elements**: Consider using Next.js's `Image` component instead of HTML `<img>` tags for better performance.

### TypeScript Configuration

If you need to temporarily disable certain TypeScript checks during development, you can modify the `tsconfig.json` file. The current configuration includes:

```json
{
  "compilerOptions": {
    // Other options...
    "noImplicitAny": false, // Temporarily disable to allow building with existing any types
    "noUnusedLocals": false, // Temporarily disable to allow building with unused variables
    "noUnusedParameters": false // Temporarily disable to allow building with unused parameters
  }
}
```

## Acknowledgements

- [Next.js](https://nextjs.org/)
- [React Calendar Heatmap](https://github.com/kevinsqi/react-calendar-heatmap)
- [GitLab API](https://docs.gitlab.com/ee/api/)
