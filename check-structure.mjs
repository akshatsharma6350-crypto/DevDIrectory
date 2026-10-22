// Run: node check-structure.mjs  — verifies the project folder layout from the lab spec
import { existsSync, readdirSync } from 'node:fs';

const required = [
  'index.html', 'package.json', 'vite.config.js',
  'src/main.jsx', 'src/App.jsx',
  'src/assets/global.css', 'src/assets/logo.svg',
  'src/components/Navbar.jsx', 'src/components/UserCard.jsx', 'src/components/ProtectedRoute.jsx',
  'src/components/SkeletonLoader.jsx', 'src/components/AlertBanner.jsx', 'src/components/ProjectCard.jsx',
  'src/components/Footer.jsx', 'src/components/ErrorBoundary.jsx',
  'src/context/AuthContext.jsx', 'src/context/ThemeContext.jsx', 'src/context/TrackerContext.jsx',
  'src/components/Charts.jsx', 'src/components/Badges.jsx', 'src/components/StatusBadge.jsx', 'src/components/TaskBoard.jsx',
  'src/utils/tracker.js', 'src/utils/confirmToast.jsx', 'src/data/seedTracker.js',
  'src/hooks/useDebounce.js', 'src/hooks/useFetch.js', 'src/hooks/useLocalStorage.js',
  'src/pages/Home.jsx', 'src/pages/UserDirectory.jsx', 'src/pages/UserProfile.jsx', 'src/pages/AddPost.jsx',
  'src/pages/Login.jsx', 'src/pages/NotFound.jsx', 'src/pages/ProjectStore.jsx', 'src/pages/ProjectViewer.jsx', 'src/pages/AddProject.jsx',
  'src/services/api.js', 'src/services/postService.js', 'src/services/userService.js',
  'src/services/projectService.js', 'src/services/authService.js',
  'src/utils/helpers.js', 'src/data/seedProjects.js',
  'public/favicon.svg', 'public/projects/todo/index.html', 'public/projects/news-reader/index.html',
  'server/index.js', 'server/db.js', 'server/seed.js', 'server/package.json',
];

const missing = required.filter((f) => !existsSync(f));
if (missing.length === 0) {
  console.log(`✅ Structure OK — all ${required.length} required files are in place.`);
  console.log(existsSync('node_modules') ? '✅ node_modules found.' : '⚠️  Run: npm install');
} else {
  console.log(`❌ ${missing.length} file(s) missing or in the wrong folder:\n`);
  missing.forEach((f) => console.log('  - ' + f));
  console.log('\nFiles found in this folder:', readdirSync('.').join(', '));
  console.log('\nTip: extract the ZIP as a whole instead of copying files one by one.');
  process.exitCode = 1;
}
