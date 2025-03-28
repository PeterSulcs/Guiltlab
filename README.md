# GuiltLab

GuiltLab is a Next.js application that aggregates and visualizes your contributions across multiple GitLab instances. See all your contributions in one place with a unified heatmap and leaderboard.

## Features

- Connect to multiple GitLab instances using personal access tokens
- View an aggregated heatmap of your contributions across all instances
- See a leaderboard of contributions
- Secure storage of your GitLab instance configurations in your browser's localStorage

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
   - The token should have `api`, `read_user`, and `read_api` scopes.

2. Once you've added your instances, the heatmap and leaderboard will automatically populate with your contribution data.

3. Hover over the heatmap cells to see details about your contributions for each day.

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

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [Next.js](https://nextjs.org/)
- [React Calendar Heatmap](https://github.com/kevinsqi/react-calendar-heatmap)
- [GitLab API](https://docs.gitlab.com/ee/api/)
