import { useState, useCallback, useRef } from 'react';
import { ClarvidaJobTemplate } from '@/types/organization';
import { ContextItem, ExtractionState, mapItemTypeToContentType, DEFAULT_CLARVIDA_TEMPLATE } from './types';
import { functionBridge } from '@/lib/function-bridge';
import { toast } from 'sonner';

interface OptimizationState {
  isOptimizing: boolean;
  lastOptimizationTime: string | null;
  totalOptimizations: number;
  lastSummary: {
    fields_updated: string[];
    fields_added: string[];
    duplicates_removed: number;
    enhancements_made: string[];
  } | null;
}

export function useContextBuilder(initialTemplate?: Partial<ClarvidaJobTemplate>) {
  // Context items state
  const [contextItems, setContextItems] = useState<ContextItem[]>([]);

  // Template state (form data)
  const [template, setTemplate] = useState<Partial<ClarvidaJobTemplate>>({
    ...DEFAULT_CLARVIDA_TEMPLATE,
    ...initialTemplate,
  });

  // Extraction tracking state
  const [extractionState, setExtractionState] = useState<ExtractionState>({
    isExtracting: false,
    lastExtractionSource: null,
    extractedFields: new Set(),
    userOverrides: new Set(),
    confidence: 0,
    fieldsExtracted: 0,
  });

  // Optimization tracking state
  const [optimizationState, setOptimizationState] = useState<OptimizationState>({
    isOptimizing: false,
    lastOptimizationTime: null,
    totalOptimizations: 0,
    lastSummary: null,
  });

  // Track user edits to prevent AI overwriting
  const userEditedFields = useRef<Set<string>>(new Set());

  // Deep get nested value from object
  const getNestedValue = useCallback((obj: any, path: string): any => {
    return path.split('.').reduce((acc, key) => acc?.[key], obj);
  }, []);

  // Deep set nested value in object
  const setNestedValue = useCallback((obj: any, path: string, value: any): any => {
    const keys = path.split('.');
    const newObj = { ...obj };
    let current: any = newObj;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      current[key] = current[key] ? { ...current[key] } : {};
      current = current[key];
    }

    current[keys[keys.length - 1]] = value;
    return newObj;
  }, []);

  // Merge extracted data without overwriting user edits
  const mergeExtractedData = useCallback((
    extractedData: Partial<ClarvidaJobTemplate>,
    meta: { confidence: number; fields_extracted: number }
  ) => {
    setTemplate(prev => {
      let merged = { ...prev };
      const newExtractedFields = new Set<string>();

      // Flatten and merge extracted data
      const flattenAndMerge = (data: any, prefix = '') => {
        for (const [key, value] of Object.entries(data)) {
          if (value === null || value === undefined) continue;

          const fieldPath = prefix ? `${prefix}.${key}` : key;

          // Skip if user has edited this field
          if (userEditedFields.current.has(fieldPath)) {
            continue;
          }

          if (typeof value === 'object' && !Array.isArray(value)) {
            // Recursively handle nested objects
            flattenAndMerge(value, fieldPath);
          } else {
            // Check if field is empty or default before setting
            const currentValue = getNestedValue(merged, fieldPath);
            const isEmpty = currentValue === '' || currentValue === 0 ||
                           currentValue === null || currentValue === undefined ||
                           (Array.isArray(currentValue) && currentValue.length === 0);

            if (isEmpty || !userEditedFields.current.has(fieldPath)) {
              merged = setNestedValue(merged, fieldPath, value);
              newExtractedFields.add(fieldPath);
            }
          }
        }
      };

      flattenAndMerge(extractedData);

      // Update extraction state
      setExtractionState(prev => ({
        ...prev,
        extractedFields: new Set([...prev.extractedFields, ...newExtractedFields]),
        confidence: meta.confidence,
        fieldsExtracted: meta.fields_extracted,
      }));

      return merged;
    });
  }, [getNestedValue, setNestedValue]);

  // Optimize template after context is added
  const optimizeTemplate = useCallback(async (
    currentTemplate: Partial<ClarvidaJobTemplate>,
    newContext: string | any,
    contextType: string
  ) => {
    setOptimizationState(prev => ({ ...prev, isOptimizing: true }));

    try {
      console.log('Starting template optimization...', {
        contextType,
        userEditedFields: Array.from(userEditedFields.current)
      });

      const result = await functionBridge.optimizeJobTemplate({
        currentTemplate,
        newContext,
        contextType,
        userEditedFields: Array.from(userEditedFields.current)
      });

      if (result.success && result.data) {
        // Update template with optimized data
        setTemplate(result.data);

        // Track which fields were updated by optimization
        const newExtractedFields = new Set<string>();
        if (result.summary?.fields_updated) {
          result.summary.fields_updated.forEach(f => newExtractedFields.add(f));
        }
        if (result.summary?.fields_added) {
          result.summary.fields_added.forEach(f => newExtractedFields.add(f));
        }

        setExtractionState(prev => ({
          ...prev,
          extractedFields: new Set([...prev.extractedFields, ...newExtractedFields]),
          confidence: result.summary?.confidence || prev.confidence,
        }));

        setOptimizationState(prev => ({
          isOptimizing: false,
          lastOptimizationTime: new Date().toISOString(),
          totalOptimizations: prev.totalOptimizations + 1,
          lastSummary: result.summary ? {
            fields_updated: result.summary.fields_updated || [],
            fields_added: result.summary.fields_added || [],
            duplicates_removed: result.summary.duplicates_removed || 0,
            enhancements_made: result.summary.enhancements_made || [],
          } : null,
        }));

        // Show optimization summary
        const updatedCount = result.summary?.fields_updated?.length || 0;
        const addedCount = result.summary?.fields_added?.length || 0;
        const deduped = result.summary?.duplicates_removed || 0;

        if (updatedCount > 0 || addedCount > 0 || deduped > 0) {
          const parts = [];
          if (addedCount > 0) parts.push(`${addedCount} fields added`);
          if (updatedCount > 0) parts.push(`${updatedCount} enhanced`);
          if (deduped > 0) parts.push(`${deduped} duplicates removed`);
          toast.success(`Optimized: ${parts.join(', ')}`);
        }

        return result.data;
      } else {
        console.warn('Optimization returned no data:', result.error);
        setOptimizationState(prev => ({ ...prev, isOptimizing: false }));
      }
    } catch (error) {
      console.error('Template optimization failed:', error);
      setOptimizationState(prev => ({ ...prev, isOptimizing: false }));
      // Don't show error toast - optimization is a nice-to-have enhancement
    }

    return currentTemplate;
  }, []);

  // Extract ClarvidaJobTemplate fields from context and then optimize
  const extractFromContext = useCallback(async (item: ContextItem) => {
    setExtractionState(prev => ({
      ...prev,
      isExtracting: true,
      lastExtractionSource: item.title,
    }));

    let extractedData: any = null;

    try {
      // Check if this item already has pre-extracted job data from Gemini
      // This happens when files are processed directly by Gemini multimodal API
      if (item.metadata?.extractedJobData && Object.keys(item.metadata.extractedJobData).length > 0) {
        console.log('Using pre-extracted Gemini data:', {
          source: item.title,
          fields: Object.keys(item.metadata.extractedJobData).length,
          confidence: item.metadata?.confidence
        });

        extractedData = item.metadata.extractedJobData;
        const fieldsCount = Object.keys(extractedData).filter(k => extractedData[k] !== null).length;

        mergeExtractedData(extractedData, {
          confidence: item.metadata?.confidence || 0.8,
          fields_extracted: fieldsCount,
        });

        if (fieldsCount > 0) {
          toast.success(`AI extracted ${fieldsCount} fields from ${item.title}`);
        }
      } else {
        // Fall back to text-based extraction for other content types
        const result = await functionBridge.extractJobContext({
          content: item.content,
          contentType: mapItemTypeToContentType(item.type),
          metadata: item.metadata,
        });

        if (result.success && result.data) {
          extractedData = result.data;
          mergeExtractedData(result.data, {
            confidence: result.extractionMeta?.confidence || 0.5,
            fields_extracted: result.extractionMeta?.fields_extracted || 0,
          });

          const fieldsCount = result.extractionMeta?.fields_extracted || 0;
          if (fieldsCount > 0) {
            toast.success(`Extracted ${fieldsCount} fields from ${item.title}`);
          }
        } else if (result.error) {
          console.error('Extraction failed:', result.error);
          toast.error('Failed to extract job details');
        }
      }
    } catch (error) {
      console.error('Extraction failed:', error);
      toast.error('Failed to extract job details from context');
    } finally {
      setExtractionState(prev => ({ ...prev, isExtracting: false }));
    }

    // After extraction completes, run optimization pass
    // Get the current template state after merging
    setTemplate(currentTemplate => {
      // Run optimization asynchronously with the updated template
      optimizeTemplate(
        currentTemplate,
        item.content || extractedData,
        item.type
      );
      return currentTemplate; // Return unchanged - optimization will update it
    });
  }, [mergeExtractedData, optimizeTemplate]);

  // Add context item and trigger extraction
  const addContextItem = useCallback(async (item: Omit<ContextItem, 'id' | 'created_at'>) => {
    const newItem: ContextItem = {
      ...item,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    };

    setContextItems(prev => [...prev, newItem]);

    // Trigger AI extraction automatically
    await extractFromContext(newItem);
  }, [extractFromContext]);

  // Remove context item
  const removeContextItem = useCallback((itemId: string) => {
    setContextItems(prev => prev.filter(item => item.id !== itemId));
  }, []);

  // Update template field (marks as user-edited)
  // CRITICAL: Only update extractionState if the field isn't already tracked
  // Creating a new Set on every keystroke causes re-renders and input focus loss
  const updateTemplate = useCallback((path: string, value: any) => {
    // Mark this field as user-edited (ref doesn't cause re-renders)
    userEditedFields.current.add(path);

    // Only update extraction state if this field isn't already marked as user-overridden
    // This prevents unnecessary re-renders on every keystroke
    setExtractionState(prev => {
      if (prev.userOverrides.has(path)) {
        return prev; // Return same object reference - no state change, no re-render
      }
      const newOverrides = new Set(prev.userOverrides);
      newOverrides.add(path);
      return { ...prev, userOverrides: newOverrides };
    });

    setTemplate(prev => setNestedValue(prev, path, value));
  }, [setNestedValue]);

  // Check if field was AI-extracted (for visual indicator)
  const isFieldExtracted = useCallback((fieldPath: string) => {
    return extractionState.extractedFields.has(fieldPath) &&
           !extractionState.userOverrides.has(fieldPath);
  }, [extractionState]);

  // Reset user edits for a field (allow AI to fill again)
  const resetFieldOverride = useCallback((fieldPath: string) => {
    userEditedFields.current.delete(fieldPath);
    setExtractionState(prev => {
      const newOverrides = new Set(prev.userOverrides);
      newOverrides.delete(fieldPath);
      return { ...prev, userOverrides: newOverrides };
    });
  }, []);

  // Clear all context and reset
  const clearAllContext = useCallback(() => {
    setContextItems([]);
    userEditedFields.current.clear();
    setExtractionState({
      isExtracting: false,
      lastExtractionSource: null,
      extractedFields: new Set(),
      userOverrides: new Set(),
      confidence: 0,
      fieldsExtracted: 0,
    });
  }, []);

  return {
    // State
    contextItems,
    template,
    extractionState,
    optimizationState,

    // Actions
    addContextItem,
    removeContextItem,
    updateTemplate,
    setTemplate,
    optimizeTemplate,

    // Utilities
    isFieldExtracted,
    resetFieldOverride,
    clearAllContext,
    getNestedValue,
  };
}

export type UseContextBuilderReturn = ReturnType<typeof useContextBuilder>;
