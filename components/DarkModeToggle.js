import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export default function DarkModeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="bg-gray-200 dark:bg-gray-700 px-3 py-2 rounded-md shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xl"
      aria-label="Toggle Dark Mode"
    >
      {theme === 'dark' ? '🌞' : '🌙'}
    </button>
  );
}
