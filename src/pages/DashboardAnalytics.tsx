import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { Dashboard } from '../components/dashboard/Dashboard';
import { Button } from '../components/ui/button';

export const DashboardAnalytics: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();

  if (!jobId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Invalid Job ID
          </h1>
          <p className="text-gray-600 mb-6">
            Please provide a valid job ID to view dashboard analytics.
          </p>
          <Button onClick={() => navigate('/')}>
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className="mr-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <h1 className="text-xl font-semibold text-gray-900">
                Dashboard Analytics
              </h1>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`/search?jobId=${jobId}`, '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View Search
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Dashboard jobId={jobId} />
      </div>
    </div>
  );
};