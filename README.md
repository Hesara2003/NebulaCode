# 🚀 NebulaCode (Cloud IDE + AI Workspace)

A high-complexity, full cloud-based development environment similar to VS Code but fully web-based, with real-time collaboration, AI assistance, terminals, Docker sandboxes, and multi-language support.

## 🔥 Project Summary

- **Web-based IDE like VS Code**: Monaco editor as the core text editor.
- **AI code assistant**: ChatGPT-powered or local model.
- **Docker-based execution environment**: Secure sandboxes for running code.
- **Built-in terminal**: xterm.js integrated.
- **Multiple language runtimes**: Node, Python, Java, C++, Go.
- **Real-time multi-user collaboration**: Work together in real-time.
- **LSP (Language Server Protocol) support**: IntelliSense and code features.
- **Versioned cloud workspaces**: Save and manage your projects.

## 🔥 Tech Stack

### Frontend
- **Next.js** (React + TypeScript)
- **@monaco-editor/react**
- **xterm.js** for terminal
- **Tailwind CSS** for styling
- **Yjs + y-websocket** for collaboration

### Backend
- **Node.js** (NestJS)
- **Postgres** for metadata
- **Redis** for job queue + caching
- **Docker API integration**

### DevOps
- **Docker / Docker Compose**
- **Kubernetes** (planned)

## 🛠️ Getting Started

### Prerequisites
- Node.js
- Docker & Docker Compose

### Installation

1.  Clone the repository.
2.  Install dependencies:

    ```bash
    # Frontend
    cd frontend
    npm install

    # Backend
    cd ../backend
    npm install
    ```

### Running the Project

You can run the entire stack using Docker Compose:

```bash
docker-compose up --build
```

Or run services individually for development:

**Frontend:**
```bash
cd frontend
npm run dev
```

**Backend:**
```bash
cd backend
npm run start:dev
```

## 📂 Project Structure

- `frontend/`: Next.js application
- `backend/`: NestJS application
- `docker-compose.yml`: Docker orchestration
