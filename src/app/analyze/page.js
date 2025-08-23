'use client';

import Link from 'next/link';

export default function AnalyzePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-4xl font-bold mb-6">GitHub Repository Analysis</h1>
        <p className="text-lg text-gray-600 mb-8">
          This is where users will be able to analyze their GitHub repositories for cloud architecture optimization.
        </p>
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Feature coming soon! This page will include:
          </p>
          <ul className="text-left text-sm text-gray-600 space-y-2">
            <li>• GitHub repository URL input</li>
            <li>• Automated code analysis</li>
            <li>• Technology stack detection</li>
            <li>• Cloud architecture recommendations</li>
          </ul>
        </div>
        <div className="mt-8">
          <Link 
            href="/" 
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}