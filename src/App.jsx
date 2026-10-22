import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Footer from './components/Footer';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import SkeletonLoader from './components/SkeletonLoader';
import Home from './pages/Home';
import Login from './pages/Login';
import NotFound from './pages/NotFound';

// Code-split heavier routes so the first paint stays fast
const UserDirectory = lazy(() => import('./pages/UserDirectory'));
const UserProfile = lazy(() => import('./pages/UserProfile'));
const AddPost = lazy(() => import('./pages/AddPost'));
const ProjectStore = lazy(() => import('./pages/ProjectStore'));
const ProjectViewer = lazy(() => import('./pages/ProjectViewer'));
const AddProject = lazy(() => import('./pages/AddProject'));

export default function App() {
  return (
    <div className="app-shell">
      <a href="#main" className="skip-link">Skip to content</a>
      <Navbar />
      <main id="main">
        <Suspense fallback={<div className="container page"><SkeletonLoader count={6} /></div>}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/users" element={<UserDirectory />} />
            <Route path="/users/:id" element={<UserProfile />} />
            <Route path="/login" element={<Login />} />
            <Route path="/add-post" element={<ProtectedRoute><AddPost /></ProtectedRoute>} />

            {/* Project Store */}
            <Route path="/projects" element={<ProjectStore />} />
            <Route path="/projects/new" element={<ProtectedRoute><AddProject /></ProtectedRoute>} />
            <Route path="/projects/:id" element={<ProjectViewer />} />
            <Route path="/projects/:id/edit" element={<ProtectedRoute><AddProject /></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: { background: 'var(--surface-2)', color: 'var(--text)', border: '1px solid var(--border-strong)', borderRadius: '14px', fontSize: '.92rem' },
          success: { iconTheme: { primary: '#34d399', secondary: '#0a0a0a' } },
          error: { iconTheme: { primary: '#f87171', secondary: '#0a0a0a' } },
        }}
      />
    </div>
  );
}
