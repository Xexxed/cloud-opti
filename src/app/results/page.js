'use client';

import Link from 'next/link';

export default function ResultsPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-4xl font-bold mb-6">Architecture Recommendations</h1>
        <p className="text-lg text-gray-600 mb-8">
          This is where users will see their personalized cloud architecture recommendations and cost analysis results.
        </p>
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Feature coming soon! This page will include:
          </p>
          <ul className="text-left text-sm text-gray-600 space-y-2">
            <li>• Detailed architecture diagrams</li>
            <li>• Cost breakdown and optimization suggestions</li>
            <li>• Infrastructure as Code templates</li>
            <li>• Performance and security recommendations</li>
            <li>• Comparison with alternative architectures</li>
          </ul>
        </div>
        <div className="mt-8 flex gap-4 justify-center">
          <Link 
            href="/analyze" 
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Analyze Repository
          </Link>
          <Link 
            href="/" 
            className="inline-flex items-center px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}