'use client';

import Link from 'next/link';

export default function EstimatePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-4xl font-bold mb-6">Manual Stack Selection</h1>
        <p className="text-lg text-gray-600 mb-8">
          This is where users will be able to manually select their technology stack for cloud architecture optimization.
        </p>
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Feature coming soon! This page will include:
          </p>
          <ul className="text-left text-sm text-gray-600 space-y-2">
            <li>• Technology stack picker interface</li>
            <li>• Framework and language selection</li>
            <li>• Database and storage requirements</li>
            <li>• Expected traffic and scale inputs</li>
            <li>• Cost estimation and recommendations</li>
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