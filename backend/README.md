# Clio's Gambit - Backend API

The backend server for Clio's Gambit, a chess academy platform combining ancient wisdom with modern strategy.

## Tech Stack
- **Node.js & Express**: Core server framework.
- **PostgreSQL (Supabase)**: Primary database for user accounts and curriculum.
- **Nodemailer**: For automated password reset emails.
- **Bcrypt**: Secure password hashing.

## Configuration
Create a `.env` file in the root of the `backend` directory with the following variables:

```env
DATABASE_URL=postgresql://<user>:<password>@<host>:<port>/postgres
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-passcode
```

*Note: For Gmail, use an [App Password](https://myaccount.google.com/apppasswords).*

## Installation & Running
```bash
# Install dependencies
npm install

# Run in development mode
npm run dev
```

## Key API Endpoints
- `POST /api/auth/login`: Authenticate user against PostgreSQL.
- `POST /api/auth/forgot-password`: Send real reset email via Nodemailer.
- `GET /api/student/story-modules`: Fetch live curriculum modules from DB.
