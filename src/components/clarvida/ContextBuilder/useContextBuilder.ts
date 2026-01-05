import { useState, useCallback, useRef } from 'react';
import { ClarvidaJobTemplate } from '@/types/organization';
import { ContextItem, ExtractionState, mapItemTypeToContentType, DEFAULT_CLARVIDA_TEMPLATE } from './types';
import { functionBridge } from '@/lib/function-bridge';
import { toast } from 'sonner';

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

  // Extract ClarvidaJobTemplate fields from context
  const extractFromContext = useCallback(async (item: ContextItem) => {
    setExtractionState(prev => ({
      ...prev,
      isExtracting: true,
      lastExtractionSource: item.title,
    }));

    try {
      const result = await functionBridge.extractJobContext({
        content: item.content,
        contentType: mapItemTypeToContentType(item.type),
        metadata: item.metadata,
      });

      if (result.success && result.data) {
        mergeExtractedData(result.data, {
          confidence: result.extractionMeta?.confidence || 0.5,
          fields_extracted: result.extractionMeta?.fields_extracted || 0,
        });

        const fieldsCount = result.extractionMeta?.fields_extracted || 0;
        if (fieldsCount > 0) {
          toast.success(`Extracted ${fieldsCount} fields from ${item.title}`);
        } else {
          toast.info('No new fields extracted from this content');
        }
      } else if (result.error) {
        console.error('Extraction failed:', result.error);
        toast.error('Failed to extract job details');
      }
    } catch (error) {
      console.error('Extraction failed:', error);
      toast.error('Failed to extract job details from context');
    } finally {
      setExtractionState(prev => ({ ...prev, isExtracting: false }));
    }
  }, [mergeExtractedData]);

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
  const updateTemplate = useCallback((path: string, value: any) => {
    // Mark this field as user-edited
    userEditedFields.current.add(path);

    setExtractionState(prev => ({
      ...prev,
      userOverrides: new Set([...prev.userOverrides, path]),
    }));

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

    // Actions
    addContextItem,
    removeContextItem,
    updateTemplate,
    setTemplate,

    // Utilities
    isFieldExtracted,
    resetFieldOverride,
    clearAllContext,
    getNestedValue,
  };
}

export type UseContextBuilderReturn = ReturnType<typeof useContextBuilder>;
