import { useState } from 'react';
import { functions, isFirebaseConfigured } from '../lib/firebase';
import { httpsCallable } from 'firebase/functions';

export function CloudFunctionTest() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testBooleanSearch = async () => {
    if (!isFirebaseConfigured() || !functions) {
      setError('Firebase not configured');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const generateBooleanSearch = httpsCallable(functions, 'generateBooleanSearch');

      const response = await generateBooleanSearch({
        requiredSkills: ['JavaScript', 'React', 'TypeScript'],
        optionalSkills: ['Node.js', 'GraphQL'],
        jobTitles: ['Senior Software Engineer', 'Full Stack Developer'],
        excludeTerms: ['Junior', 'Intern'],
        experienceYears: 5
      });

      setResult(response.data);
    } catch (err: any) {
      setError(err.message || 'Failed to call function');
    } finally {
      setLoading(false);
    }
  };

  const testHealthCheck = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `https://us-central1-applycodes-2683f.cloudfunctions.net/healthCheck`
      );
      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Failed to call health check');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded bg-white shadow">
      <h3 className="text-lg font-semibold mb-4">Cloud Function Test</h3>

      <div className="space-y-2 mb-4">
        <button
          onClick={testHealthCheck}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 mr-2"
        >
          Test Health Check
        </button>

        <button
          onClick={testBooleanSearch}
          disabled={loading}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400"
        >
          Test Boolean Search
        </button>
      </div>

      {loading && (
        <div className="text-blue-500">Calling Cloud Function...</div>
      )}

      {error && (
        <div className="text-red-500 mt-2">
          <strong>Error:</strong> {error}
        </div>
      )}

      {result && (
        <div className="mt-4 p-3 bg-gray-100 rounded">
          <strong>Result:</strong>
          <pre className="text-xs mt-2 overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}

      <div className="mt-4 text-xs text-gray-600">
        <p>Functions URL: https://us-central1-applycodes-2683f.cloudfunctions.net/</p>
        <p>Note: Functions must be deployed first using: firebase deploy --only functions</p>
      </div>
    </div>
  );
}