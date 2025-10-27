# CMS Admin Dashboard

A modern React admin dashboard for managing your CMS content.

## Features

- 📝 **Posts Management** - Create, edit, and delete blog posts with rich content
- 📁 **Categories** - Organize posts with categories
- 🏷️ **Tags** - Label posts with multiple tags
- 💬 **Comments** - Moderate and manage comments
- 📤 **File Uploads** - Upload and manage images, PDFs, and videos
- 🔐 **Authentication** - Secure login with JWT tokens
- 👤 **Role-based Access** - Admin and user roles with different permissions

## Tech Stack

- **React 18** - Modern React with hooks
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **TailwindCSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **React Query** - Server state management
- **Axios** - HTTP client with interceptors

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Backend API running on `http://localhost:3000`

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
The `.env` file is already configured to connect to `http://localhost:3000/api`

3. Start the development server:
```bash
npm run dev
```

4. Open your browser to `http://localhost:5173`

### Default Login

Use the credentials you created when registering a user through the backend API.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Project Structure

```
admin/
├── src/
│   ├── components/
│   │   └── Layout.tsx          # Main layout with sidebar
│   ├── contexts/
│   │   └── AuthContext.tsx     # Authentication state
│   ├── pages/
│   │   ├── Login.tsx           # Login page
│   │   ├── Dashboard.tsx       # Dashboard home
│   │   ├── Posts.tsx           # Posts list
│   │   ├── PostForm.tsx        # Create/edit post
│   │   ├── Categories.tsx      # Category management
│   │   ├── Tags.tsx            # Tag management
│   │   ├── Comments.tsx        # Comment moderation
│   │   └── Uploads.tsx         # File uploads
│   ├── services/
│   │   └── api.ts              # API client
│   ├── App.tsx                 # Root component
│   ├── main.tsx                # Entry point
│   └── index.css               # Global styles
├── .env                        # Environment variables
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

## Features Overview

### Dashboard
- View statistics for posts, categories, tags, and comments
- Quick actions for common tasks
- System information display

### Posts
- List all posts with pagination
- Search posts by title/content
- Create new posts with categories and tags
- Edit existing posts
- Delete posts
- Toggle publish status

### Categories
- Create, edit, and delete categories
- Auto-generated slugs
- Admin-only access

### Tags
- Create, edit, and delete tags
- Grid view display
- Admin-only access

### Comments
- View all comments (admin only)
- Filter by approved/pending status
- Approve or unapprove comments
- Delete comments
- See related post information

### Uploads
- Upload single or multiple files
- Support for images, PDFs, and videos
- File preview
- Copy URL to clipboard
- File size display

## Customization

### Colors
Edit `tailwind.config.js` to customize the color scheme.

### API URL
Edit `.env` to change the backend API URL:
```
VITE_API_URL=http://your-api-url.com/api
```

### Components
All components use TailwindCSS classes and can be easily customized by editing the className props.

## Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory. Deploy these files to any static hosting service (Netlify, Vercel, GitHub Pages, etc.).

## Troubleshooting

### Can't connect to API
- Make sure the backend is running on `http://localhost:3000`
- Check the `.env` file has the correct API URL
- Verify CORS is enabled on the backend

### Login not working
- Ensure you have registered a user through the backend API
- Check browser console for error messages
- Verify JWT token is being stored in localStorage

### Pages not loading
- Clear browser cache and localStorage
- Check browser console for errors
- Ensure all dependencies are installed with `npm install`

## License

MIT
