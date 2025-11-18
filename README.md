# Arnacon Verification App

A React application for verifying email addresses and ENS names to use as calling identities for the Arnacon Web3 Telecom Protocol.

## Features

- **Email Verification**: Verify your email address for use as a calling identity
- **ENS Verification**: Verify your ENS name through wallet signature verification
- **Product Portal**: Interface for accessing Arnacon products and services
- **Mobile-Responsive**: Optimized for embedding in mobile webviews

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd add-product-html
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

The application will be available at [http://localhost:3000](http://localhost:3000).

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Runs the app in development mode |
| `npm test` | Launches the test runner |
| `npm run build` | Builds the app for production |

## Docker Deployment

This application can be containerized and deployed to cloud platforms like Google Cloud Run.

### Building and Running with Docker

1. Build the Docker image:
   ```bash
   docker build -t arnacon-verification-app .
   ```

2. Run the container locally:
   ```bash
   docker run -p 8080:80 arnacon-verification-app
   ```

The application will be accessible at [http://localhost:8080](http://localhost:8080).

### Quick Test Script

For a quick test of the Docker setup, run:

```bash
./docker-test.sh
```

This will build and run the Docker container locally.

### Cloud Deployment

To deploy to Google Cloud Run, update the variables in `deploy-to-gcloud.sh` and run:

```bash
./deploy-to-gcloud.sh
```

For detailed instructions, see [Docker Deployment Guide](README.docker.md).

## Project Structure

- `/src/pages`: Main application pages
- `/src/components`: Reusable React components
- `/src/styles`: CSS styles for the application
- `/src/utils`: Utility functions and helpers

## Technologies Used

- React 
- React Router
- ENS Resolution
- WalletConnect for Web3 authentication

## License

This project is proprietary and confidential.

---

*For more detailed information about Docker deployment, see [README.docker.md](README.docker.md).*
