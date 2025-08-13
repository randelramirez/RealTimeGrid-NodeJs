# Real-time Employee Grid - Node.js Implementation

This project is a Node.js/Express + Socket.IO implementation of the original [RealtimeGrid](https://github.com/randelramirez/RealtimeGrid) repository.

This is a Node.js/Express implementation of a real-time collaborative employee grid using Socket.IO for real-time communication and SQLite for data storage.

## Architecture

### Backend (Node.js/Express)
- **Framework**: Express.js with TypeScript
- **Real-time Communication**: Socket.IO (instead of SignalR)
- **Database**: SQLite with direct SQL queries
- **Security**: HTTPS support with SSL certificates, CORS, Helmet
- **Port**: 5043 (HTTPS)

### Frontend (React/TypeScript)
- **Framework**: React with TypeScript and Vite
- **State Management**: TanStack Query (React Query)
- **Real-time Client**: Socket.IO Client (instead of SignalR client)
- **UI**: Custom CSS with responsive design
- **Port**: 5173 (HTTPS)

## Features

### Real-time Collaboration
- **Employee Locking**: When a user starts editing an employee, it gets locked for other users
- **Live Updates**: Changes made by one user are immediately visible to all other connected users
- **Connection Status**: Visual indicators showing connection state
- **Automatic Reconnection**: Handles network interruptions gracefully

### CRUD Operations
- **Create**: Add new employees with real-time broadcast
- **Read**: View all employees with live updates
- **Update**: Edit employee details with field-level real-time sync
- **Delete**: Remove employees with immediate updates across all clients

### Socket.IO Events
- `lock` / `lockEmployee` - Lock an employee for editing
- `unlock` / `unlockEmployee` - Release lock on an employee
- `lockFailed` - Notification when lock attempt fails
- `updateEmployee` / `employeeUpdated` - Real-time field updates
- `employeeCreated` - New employee added
- `employeeDeleted` - Employee removed
- `getLockStatus` / `lockStatusUpdate` - Sync lock states

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Backend Setup

1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Generate SSL certificates (optional, for HTTPS):
   ```powershell
   # In PowerShell
   .\generate-certs.ps1
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

The backend will start on `https://localhost:5043` (or `http://localhost:5043` if no SSL certs)

### Frontend Setup

1. Navigate to frontend directory:
   ```bash
   cd frontend/realtime-grid-frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

The frontend will start on `https://localhost:5173`

## API Endpoints

### REST API
- `GET /api/employees` - Get all employees
- `GET /api/employees/:id` - Get employee by ID
- `POST /api/employees` - Create new employee
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee
- `GET /health` - Health check

## Database Schema

### Employees Table
```sql
CREATE TABLE employees (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  sex TEXT NOT NULL,
  salary REAL NOT NULL
);
```

## Development

### Backend Scripts
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server

### Frontend Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

## Differences from .NET Version

1. **Real-time Library**: Socket.IO instead of SignalR
2. **Database**: Direct SQLite queries instead of Entity Framework
3. **Authentication**: Simplified (no authentication in this version)
4. **SSL**: Self-signed certificates for local development
5. **Event Names**: Adapted Socket.IO naming conventions

## Testing Real-time Features

1. Open multiple browser windows/tabs to `https://localhost:5173`
2. Start editing an employee in one window - it should appear locked in others
3. Make changes and see them propagate in real-time
4. Add or delete employees and observe updates across all clients

## Security Considerations

- Uses HTTPS for secure communication
- CORS configured for localhost development
- Helmet.js for security headers
- Input validation on API endpoints
- SQL injection prevention through parameterized queries
