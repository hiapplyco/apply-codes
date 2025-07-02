// Data Migration Administration Panel
// Provides UI for running and monitoring the Phase 2.3 data migration

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  AlertCircle, 
  Play, 
  Pause, 
  RotateCcw, 
  Database,
  TrendingUp,
  Users,
  Building,
  MapPin
} from 'lucide-react';
import { toast } from 'sonner';
import { runDataMigration, validateDataMigration } from '@/lib/dataMigration';
import type { DataMigrationStats } from '@/types/domains/entities';

interface MigrationStatus {
  isRunning: boolean;
  isDryRun: boolean;
  stats: DataMigrationStats | null;
  errors: string[];
  validationResult: {
    isValid: boolean;
    issues: string[];
    stats: Record<string, unknown>;
  } | null;
}

export const DataMigrationPanel: React.FC = () => {
  const [status, setStatus] = useState<MigrationStatus>({
    isRunning: false,
    isDryRun: false,
    stats: null,
    errors: [],
    validationResult: null
  });

  const updateProgress = useCallback((stats: DataMigrationStats) => {
    setStatus(prev => ({
      ...prev,
      stats
    }));
  }, []);

  const runMigration = async (dryRun: boolean) => {
    if (status.isRunning) return;

    setStatus(prev => ({
      ...prev,
      isRunning: true,
      isDryRun: dryRun,
      errors: [],
      stats: null
    }));

    try {
      toast.info(`Starting ${dryRun ? 'dry run' : 'live'} migration...`);
      
      const finalStats = await runDataMigration({
        dryRun,
        batchSize: 50,
        delayMs: 500,
        onProgress: updateProgress
      });

      setStatus(prev => ({
        ...prev,
        isRunning: false,
        stats: finalStats
      }));

      toast.success(`Migration ${dryRun ? 'dry run' : ''} completed successfully!`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setStatus(prev => ({
        ...prev,
        isRunning: false,
        errors: [...prev.errors, errorMessage]
      }));
      
      toast.error(`Migration failed: ${errorMessage}`);
    }
  };

  const runValidation = async () => {
    try {
      toast.info('Running migration validation...');
      const result = await validateDataMigration();
      
      setStatus(prev => ({
        ...prev,
        validationResult: result
      }));

      if (result.isValid) {
        toast.success('Validation passed!');
      } else {
        toast.warning(`Validation found ${result.issues.length} issues`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Validation failed';
      toast.error(errorMessage);
    }
  };

  const resetStatus = () => {
    setStatus({
      isRunning: false,
      isDryRun: false,
      stats: null,
      errors: [],
      validationResult: null
    });
  };

  const getProgressPercentage = () => {
    if (!status.stats || status.stats.total_candidates === 0) return 0;
    return Math.round((status.stats.processed_candidates / status.stats.total_candidates) * 100);
  };

  return (
    <div className="space-y-6">
      <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Data Migration Control Panel
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => runMigration(true)}
              disabled={status.isRunning}
              variant="outline"
              className="border-2 border-blue-500 hover:bg-blue-50"
            >
              <Play className="w-4 h-4 mr-2" />
              Dry Run
            </Button>
            
            <Button
              onClick={() => runMigration(false)}
              disabled={status.isRunning}
              className="bg-purple-600 hover:bg-purple-700 text-white border-2 border-black"
            >
              <Play className="w-4 h-4 mr-2" />
              Run Migration
            </Button>
            
            <Button
              onClick={runValidation}
              disabled={status.isRunning}
              variant="outline"
              className="border-2 border-green-500 hover:bg-green-50"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Validate
            </Button>
            
            <Button
              onClick={resetStatus}
              disabled={status.isRunning}
              variant="outline"
              className="border-2 border-gray-400 hover:bg-gray-50"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>

          {/* Migration Progress */}
          {status.isRunning && status.stats && (
            <Card className="border-2 border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold">
                    {status.isDryRun ? 'Dry Run' : 'Migration'} Progress
                  </span>
                  <span className="text-sm text-gray-600">
                    {status.stats.processed_candidates} / {status.stats.total_candidates}
                  </span>
                </div>
                <Progress value={getProgressPercentage()} className="mb-2" />
                <div className="text-sm text-gray-600">
                  {getProgressPercentage()}% complete
                </div>
              </CardContent>
            </Card>
          )}

          {/* Migration Statistics */}
          {status.stats && (
            <Card className="border-2 border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Migration Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {status.stats.total_candidates}
                    </div>
                    <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                      <Users className="w-4 h-4" />
                      Total Candidates
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {status.stats.processed_candidates}
                    </div>
                    <div className="text-sm text-gray-600">
                      Processed
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {status.stats.candidates_enhanced}
                    </div>
                    <div className="text-sm text-gray-600">
                      Enhanced
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {status.stats.companies_created}
                    </div>
                    <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                      <Building className="w-4 h-4" />
                      Companies Created
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-cyan-600">
                      {status.stats.locations_created}
                    </div>
                    <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                      <MapPin className="w-4 h-4" />
                      Locations Created
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {status.stats.errors}
                    </div>
                    <div className="text-sm text-gray-600">
                      Errors
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Validation Results */}
          {status.validationResult && (
            <Card className={`border-2 ${status.validationResult.isValid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {status.validationResult.isValid ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  )}
                  Validation Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Badge 
                    variant={status.validationResult.isValid ? "default" : "destructive"}
                    className="mb-3"
                  >
                    {status.validationResult.isValid ? 'PASSED' : 'FAILED'}
                  </Badge>
                  
                  {status.validationResult.issues.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Issues Found:</h4>
                      <ul className="list-disc pl-5 space-y-1">
                        {status.validationResult.issues.map((issue: string, index: number) => (
                          <li key={index} className="text-sm text-red-700">{issue}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {status.validationResult.stats && (
                    <div className="mt-4">
                      <h4 className="font-semibold mb-2">Database Statistics:</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>Total Candidates: {status.validationResult.stats.totalCandidates}</div>
                        <div>Company Entities: {status.validationResult.stats.totalCompanyEntities}</div>
                        <div>Location Entities: {status.validationResult.stats.totalLocationEntities}</div>
                        <div>Company Normalization: {status.validationResult.stats.companyNormalizationRate}%</div>
                        <div>Location Normalization: {status.validationResult.stats.locationNormalizationRate}%</div>
                        <div>Experience Extraction: {status.validationResult.stats.experienceExtractionRate}%</div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error Display */}
          {status.errors.length > 0 && (
            <Alert className="border-2 border-red-300 bg-red-50">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <div className="font-semibold">Migration Errors:</div>
                  {status.errors.map((error, index) => (
                    <div key={index} className="text-sm">{error}</div>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Instructions */}
          <Card className="border-2 border-gray-200 bg-gray-50">
            <CardContent className="p-4">
              <h4 className="font-semibold mb-2">Migration Instructions:</h4>
              <ol className="list-decimal pl-5 space-y-1 text-sm">
                <li><strong>Dry Run First:</strong> Always run a dry run to preview changes</li>
                <li><strong>Backup Data:</strong> Ensure you have recent database backups</li>
                <li><strong>Validate:</strong> Run validation after migration to check data integrity</li>
                <li><strong>Monitor:</strong> Watch the progress and error counts during migration</li>
                <li><strong>Rollback Plan:</strong> Have a rollback strategy ready if issues occur</li>
              </ol>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
};