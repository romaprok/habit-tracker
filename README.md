# Habit Tracker

A full-stack application to track your daily habits.

## Tech Stack

### Frontend

- **Framework**: [React.js](https://reactjs.org/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Routing**: [React Router](https://reactrouter.com/)
- **API Communication**: [Axios](https://axios-http.com/)

### Backend

- **Runtime**: [Node.js](https://nodejs.org/)
- **Framework**: [Express.js](https://expressjs.com/)
- **Database**: [MongoDB](https://www.mongodb.com/)
- **ODM**: [Mongoose](https://mongoosejs.com/)

### Development

- **Linting**: [ESLint](https://eslint.org/)
- **Formatting**: [Prettier](https://prettier.io/)
- **Testing**: [Jest](https://jestjs.io/) & [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)

## Features

### Frontend

- [ ] **User Authentication**: Secure user registration and login, with OAuth options (e.g., Google, GitHub).
- [ ] **Habit Dashboard**: View, create, edit, and delete habits.
- [ ] **Habit Tracking**: Mark habits as complete and view progress over time.
- [ ] **Responsive Design**: Fully responsive and mobile-friendly interface.

### Backend

- [ ] **RESTful API**: A fully-featured API for managing users and habits.
- [ ] **User Management**: Secure user authentication and authorization using JWT and OAuth 2.0.
- [ ] **Database**: MongoDB for storing user and habit data.

### Development & CI/CD

- [ ] **Linting & Formatting**: ESLint and Prettier for clean, consistent code.
- [ ] **Testing**: Unit and integration tests with Jest and React Testing Library.
- [ ] **Continuous Integration**: Automated builds and tests using GitHub Actions.
- [ ] **Continuous Deployment**: Automated deployments to a cloud platform.

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or yarn
- MongoDB

### Installation

1.  **Clone the repository**:

    ```bash
    git clone https://github.com/your-username/habit-tracker.git
    cd habit-tracker
    ```

2.  **Install frontend dependencies**:

    ```bash
    cd front
    npm install
    ```

3.  **Install backend dependencies**:

    ```bash
    cd ../back
    npm install
    ```

### Running the Application

1.  **Start the backend server**:

    ```bash
    cd back
    npm start
    ```

2.  **Start the frontend development server**:

    ```bash
    cd front
    npm run dev
    ```

The application will be available at `http://localhost:5173`.
