# Real-Time Employee Grid - Node.js Implementation

This is a Node.js/Express implementation of a real-time employee grid application using Socket.IO for real-time communication, TypeScript, and SQLite database.

## Architecture

### Backend (Node.js + Express + Socket.IO)
- **Framework**: Express.js with TypeScript
- **Real-time**: Socket.IO (replaces SignalR from the .NET version)
- **Database**: SQLite with sample employee data
- **Port**: 5046 (HTTP for development)

### Frontend (React + Vite + TypeScript)
- **Framework**: React with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + PostCSS + Autoprefixer
- **Real-time**: Socket.IO client (replaces SignalR client)
- **State Management**: TanStack Query (React Query)
- **Port**: 5173 (Vite default)

## Features

### Real-time Functionality
- **Employee Locking**: Click "Edit" to lock an employee record for editing
- **Live Updates**: See changes made by other users in real-time
- **Visual Indicators**: Locked rows are highlighted in blue
- **Automatic Unlocking**: Records are automatically unlocked when users disconnect

### CRUD Operations
- **Create**: Add new employees
- **Read**: View all employees in a grid
- **Update**: Edit employee details (name, email, sex, salary) with real-time sync
- **Delete**: Remove employees with real-time notification to all clients

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm

### Installation & Running

1. **Start the Backend**
   ```bash
   cd New/backend
   npm install
   npm run dev
   ```
   Backend will run on: http://localhost:5046

2. **Start the Frontend**
   ```bash
   cd New/frontend/realtime-grid-frontend
   npm install
   npm run dev
   ```
   Frontend will run on: http://localhost:5173

3. **Open Multiple Browser Tabs**
   - Open http://localhost:5173 in multiple tabs
   - Try editing different employees to see real-time locking
   - Make changes in one tab and watch them appear in others

## API Endpoints

- `GET /api/employees` - Get all employees
- `GET /api/employees/:id` - Get employee by ID
- `POST /api/employees` - Create new employee
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee
- `GET /health` - Health check

## Socket.IO Events

### Client → Server
- `lock` - Lock an employee for editing
- `unlock` - Unlock an employee
- `updateEmployee` - Update employee field
- `getLockStatus` - Get current lock status

### Server → Client
- `lockEmployee` - Employee was locked by another user
- `unlockEmployee` - Employee was unlocked
- `lockFailed` - Lock attempt failed
- `employeeUpdated` - Employee was updated by another user
- `employeeCreated` - New employee was created
- `employeeDeleted` - Employee was deleted
- `lockStatusUpdate` - Current lock status

## Development Notes

- The backend uses HTTP by default for development simplicity
- Sample employee data is automatically inserted on first run
- Real-time updates work across multiple browser tabs/windows
- Employee records are automatically unlocked when users disconnect

## Differences from Original (.NET) Version

1. **Backend**: Express.js instead of ASP.NET Core
2. **Real-time**: Socket.IO instead of SignalR
3. **Protocol**: HTTP instead of HTTPS (for development)
4. **Same Frontend**: React structure maintained but adapted for Socket.IO
