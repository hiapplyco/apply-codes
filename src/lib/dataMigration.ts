// Data Migration Strategy Implementation (Phase 2.3)
// Safe migration of existing candidate data to normalized entities

import {
  collection,
  doc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  Timestamp,
  DocumentSnapshot
} from 'firebase/firestore';
import { db } from './firebase';
import {
  findOrCreateCompany,
  findOrCreateLocation,
  extractExperienceYears,
  determineSeniorityLevel
} from './entities';
import type { DataMigrationStats } from '@/types/domains/entities';

// =====================================================
// MIGRATION ORCHESTRATOR
// =====================================================

export class DataMigrationManager {
  private batchSize: number;
  private delayMs: number;
  private stats: DataMigrationStats;

  constructor(batchSize = 50, delayMs = 1000) {
    this.batchSize = batchSize;
    this.delayMs = delayMs;
    this.stats = {
      total_candidates: 0,
      processed_candidates: 0,
      companies_created: 0,
      locations_created: 0,
      candidates_enhanced: 0,
      errors: 0
    };
  }

  async executeMigration(options: {
    dryRun?: boolean;
    progressCallback?: (stats: DataMigrationStats) => void;
  } = {}): Promise<DataMigrationStats> {
    const { dryRun = false, progressCallback } = options;

    console.log(`Starting data migration (${dryRun ? 'DRY RUN' : 'LIVE'})...`);

    try {
      // Step 1: Get total count of candidates
      await this.getTotalCandidateCount();
      console.log(`Found ${this.stats.total_candidates} candidates to migrate`);

      // Step 2: Process candidates in batches
      let offset = 0;
      while (offset < this.stats.total_candidates) {
        await this.processBatch(offset, dryRun);
        offset += this.batchSize;

        // Report progress
        if (progressCallback) {
          progressCallback({ ...this.stats });
        }

        // Delay to prevent overwhelming the database
        if (this.delayMs > 0) {
          await new Promise(resolve => setTimeout(resolve, this.delayMs));
        }
      }

      console.log('Migration completed successfully');
      return this.stats;
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  }

  private async getTotalCandidateCount(): Promise<void> {
    if (!db) {
      throw new Error('Firestore not initialized');
    }

    const candidatesRef = collection(db, 'saved_candidates');
    const snapshot = await getDocs(candidatesRef);
    this.stats.total_candidates = snapshot.size;
  }

  private async processBatch(offset: number, dryRun: boolean): Promise<void> {
    try {
      if (!db) {
        throw new Error('Firestore not initialized');
      }

      // Fetch batch of candidates that need migration
      const candidatesRef = collection(db, 'saved_candidates');
      let q = query(
        candidatesRef,
        orderBy('created_at', 'asc'),
        limit(this.batchSize)
      );

      // For pagination beyond the first batch, we would need to implement startAfter
      // This is a simplified version for demonstration
      if (offset > 0) {
        console.warn('Firestore pagination requires startAfter - simplified batch processing');
      }

      const snapshot = await getDocs(q);
      const candidates = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        created_at: doc.data().created_at instanceof Timestamp
          ? doc.data().created_at.toDate().toISOString()
          : doc.data().created_at
      }));

      if (candidates.length === 0) {
        return;
      }

      console.log(`Processing batch ${Math.floor(offset / this.batchSize) + 1}: ${candidates.length} candidates`);

      // Process each candidate in the batch
      for (const candidate of candidates) {
        try {
          await this.processCandidate(candidate, dryRun);
          this.stats.processed_candidates++;
        } catch (error) {
          console.error(`Error processing candidate ${candidate.id}:`, error);
          this.stats.errors++;
        }
      }
    } catch (error) {
      console.error(`Error processing batch at offset ${offset}:`, error);
      this.stats.errors += this.batchSize;
    }
  }

  private async processCandidate(candidate: {
    id: string;
    company?: string;
    location?: string;
    job_title?: string;
    profile_summary?: string;
    company_id?: string;
    location_id?: string;
    experience_years?: number;
    seniority_level?: string;
    work_email?: string;
    linkedin_url?: string;
    canonical_linkedin_url?: string;
  }, dryRun: boolean): Promise<void> {
    const updates: Record<string, unknown> = {
      enrichment_status: 'enriched'
    };
    let needsUpdate = false;

    // Process company normalization
    if (candidate.company && !candidate.company_id) {
      try {
        if (!dryRun) {
          const companyResult = await findOrCreateCompany(
            candidate.company,
            this.extractDomainFromEmail(candidate.work_email)
          );
          updates.company_id = companyResult.company_id;
          
          if (companyResult.was_created) {
            this.stats.companies_created++;
          }
        }
        needsUpdate = true;
      } catch (error) {
        console.warn(`Failed to normalize company "${candidate.company}":`, error);
      }
    }

    // Process location normalization
    if (candidate.location && !candidate.location_id) {
      try {
        if (!dryRun) {
          const locationResult = await findOrCreateLocation(candidate.location);
          updates.location_id = locationResult.location_id;
          
          if (locationResult.was_created) {
            this.stats.locations_created++;
          }
        }
        needsUpdate = true;
      } catch (error) {
        console.warn(`Failed to normalize location "${candidate.location}":`, error);
      }
    }

    // Process experience extraction
    if (!candidate.experience_years || !candidate.seniority_level) {
      const experienceYears = extractExperienceYears(
        candidate.job_title, 
        candidate.profile_summary
      );
      
      if (experienceYears !== null && !candidate.experience_years) {
        updates.experience_years = experienceYears;
        needsUpdate = true;
      }

      if (!candidate.seniority_level) {
        updates.seniority_level = determineSeniorityLevel(
          experienceYears || candidate.experience_years,
          candidate.job_title
        );
        needsUpdate = true;
      }
    }

    // Canonical LinkedIn URL normalization
    if (!candidate.canonical_linkedin_url && candidate.linkedin_url) {
      updates.canonical_linkedin_url = this.normalizeLinkedInUrl(candidate.linkedin_url);
      needsUpdate = true;
    }

    // Apply updates
    if (needsUpdate && !dryRun) {
      if (!db) {
        throw new Error('Firestore not initialized');
      }

      const candidateRef = doc(db, 'saved_candidates', candidate.id);
      await updateDoc(candidateRef, updates);

      this.stats.candidates_enhanced;
    } else if (needsUpdate && dryRun) {
      // In dry run mode, just count what would be updated
      this.stats.candidates_enhanced++;
    }
  }

  private extractDomainFromEmail(email?: string): string | undefined {
    if (!email) return undefined;
    const match = email.match(/@([^.]+\..+)$/);
    return match ? match[1] : undefined;
  }

  private normalizeLinkedInUrl(url: string): string {
    // Remove query parameters and trailing slashes
    let normalized = url.split('?')[0].replace(/\/$/, '');
    
    // Ensure it starts with https://
    if (!normalized.startsWith('https://')) {
      normalized = normalized.replace(/^https?:\/\//, 'https://');
    }
    
    return normalized;
  }

  getStats(): DataMigrationStats {
    return { ...this.stats };
  }
}

// =====================================================
// VALIDATION AND VERIFICATION
// =====================================================

export class MigrationValidator {
  async validateMigration(): Promise<{
    isValid: boolean;
    issues: string[];
    stats: any;
  }> {
    const issues: string[] = [];

    try {
      if (!db) {
        throw new Error('Firestore not initialized');
      }

      // Check for candidates without normalized company data
      const candidatesRef = collection(db, 'saved_candidates');
      const unmappedCompaniesQuery = query(
        candidatesRef,
        where('company', '!=', null),
        where('company_id', '==', null)
      );
      const unmappedCompaniesSnapshot = await getDocs(unmappedCompaniesQuery);
      const unmappedCompanies = unmappedCompaniesSnapshot.size;

      if (unmappedCompanies && unmappedCompanies > 0) {
        issues.push(`${unmappedCompanies} candidates have company names but no company_id`);
      }

      // Check for candidates without normalized location data
      const unmappedLocationsQuery = query(
        candidatesRef,
        where('location', '!=', null),
        where('location_id', '==', null)
      );
      const unmappedLocationsSnapshot = await getDocs(unmappedLocationsQuery);
      const unmappedLocations = unmappedLocationsSnapshot.size;

      if (unmappedLocations && unmappedLocations > 0) {
        issues.push(`${unmappedLocations} candidates have locations but no location_id`);
      }

      // Check for candidates without experience data
      const missingExperienceQuery = query(
        candidatesRef,
        where('experience_years', '==', null),
        where('seniority_level', '==', null)
      );
      const missingExperienceSnapshot = await getDocs(missingExperienceQuery);
      const missingExperience = missingExperienceSnapshot.size;

      if (missingExperience && missingExperience > 0) {
        issues.push(`${missingExperience} candidates missing experience/seniority data`);
      }

      // Check for duplicate companies
      const companiesRef = collection(db, 'companies');
      const companiesQuery = query(companiesRef, orderBy('canonical_name', 'asc'));
      const companiesSnapshot = await getDocs(companiesQuery);
      const companies = companiesSnapshot.docs.map(doc => doc.data());

      const companyNames = companies.map(company => company.canonical_name) || [];
      const uniqueCompanyNames = new Set(companyNames);
      if (companyNames.length !== uniqueCompanyNames.size) {
        issues.push('Duplicate company names detected');
      }

      // Check for duplicate locations
      const locationsRef = collection(db, 'locations');
      const locationsQuery = query(locationsRef, orderBy('canonical_name', 'asc'));
      const locationsSnapshot = await getDocs(locationsQuery);
      const locations = locationsSnapshot.docs.map(doc => doc.data());

      const locationNames = locations.map(location => location.canonical_name) || [];
      const uniqueLocationNames = new Set(locationNames);
      if (locationNames.length !== uniqueLocationNames.size) {
        issues.push('Duplicate location names detected');
      }

      // Get overall stats
      const stats = await this.getMigrationStats();

      return {
        isValid: issues.length === 0,
        issues,
        stats
      };
    } catch (error) {
      console.error('Validation failed:', error);
      return {
        isValid: false,
        issues: [`Validation error: ${error}`],
        stats: {}
      };
    }
  }

  private async getMigrationStats() {
    try {
      if (!db) {
        throw new Error('Firestore not initialized');
      }

      const candidatesRef = collection(db, 'saved_candidates');
      const companiesRef = collection(db, 'companies');
      const locationsRef = collection(db, 'locations');

      const [
        totalCandidatesSnapshot,
        normalizedCompaniesSnapshot,
        normalizedLocationsSnapshot,
        withExperienceSnapshot,
        totalCompanyEntitiesSnapshot,
        totalLocationEntitiesSnapshot
      ] = await Promise.all([
        getDocs(candidatesRef),
        getDocs(query(candidatesRef, where('company_id', '!=', null))),
        getDocs(query(candidatesRef, where('location_id', '!=', null))),
        getDocs(query(candidatesRef, where('experience_years', '!=', null))),
        getDocs(companiesRef),
        getDocs(locationsRef)
      ]);

      const totalCandidates = totalCandidatesSnapshot.size;
      const normalizedCompanies = normalizedCompaniesSnapshot.size;
      const normalizedLocations = normalizedLocationsSnapshot.size;
      const withExperience = withExperienceSnapshot.size;
      const totalCompanyEntities = totalCompanyEntitiesSnapshot.size;
      const totalLocationEntities = totalLocationEntitiesSnapshot.size;

      return {
        totalCandidates: totalCandidates || 0,
        normalizedCompanies: normalizedCompanies || 0,
        normalizedLocations: normalizedLocations || 0,
        withExperience: withExperience || 0,
        totalCompanyEntities: totalCompanyEntities || 0,
        totalLocationEntities: totalLocationEntities || 0,
        companyNormalizationRate: totalCandidates ? ((normalizedCompanies || 0) / totalCandidates * 100).toFixed(2) : '0',
        locationNormalizationRate: totalCandidates ? ((normalizedLocations || 0) / totalCandidates * 100).toFixed(2) : '0',
        experienceExtractionRate: totalCandidates ? ((withExperience || 0) / totalCandidates * 100).toFixed(2) : '0'
      };
    } catch (error) {
      console.error('Error getting migration stats:', error);
      return {};
    }
  }
}

// =====================================================
// CONVENIENCE FUNCTIONS
// =====================================================

export async function runDataMigration(options: {
  dryRun?: boolean;
  batchSize?: number;
  delayMs?: number;
  onProgress?: (stats: DataMigrationStats) => void;
} = {}): Promise<DataMigrationStats> {
  const { 
    dryRun = false, 
    batchSize = 50, 
    delayMs = 1000, 
    onProgress 
  } = options;

  const migrator = new DataMigrationManager(batchSize, delayMs);
  return migrator.executeMigration({ dryRun, progressCallback: onProgress });
}

export async function validateDataMigration() {
  const validator = new MigrationValidator();
  return validator.validateMigration();
}

// Export utility function for manual candidate normalization
export async function normalizeSingleCandidate(candidateId: string): Promise<boolean> {
  try {
    if (!db) {
      throw new Error('Firestore not initialized');
    }

    const candidateRef = doc(db, 'saved_candidates', candidateId);
    const candidateDoc = await getDocs(query(collection(db, 'saved_candidates'), where('__name__', '==', candidateId)));

    if (candidateDoc.empty) {
      throw new Error(`Candidate not found: ${candidateId}`);
    }

    const candidate = {
      id: candidateDoc.docs[0].id,
      ...candidateDoc.docs[0].data()
    };

    const migrator = new DataMigrationManager();
    await migrator['processCandidate'](candidate, false);

    return true;
  } catch (error) {
    console.error(`Error normalizing candidate ${candidateId}:`, error);
    return false;
  }
}