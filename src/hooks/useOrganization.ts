import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, collection, query, where, getDocs, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Organization, UserOrganization, OrgRole, hasPermission, OrgPermission } from '@/types/organization';

interface UseOrganizationResult {
  organization: Organization | null;
  userRole: OrgRole | null;
  isLoading: boolean;
  error: string | null;
  hasPermission: (permission: OrgPermission) => boolean;
  refreshOrganization: () => Promise<void>;
}

// Hook to get organization by slug
export function useOrganization(orgSlug: string, userId: string | null): UseOrganizationResult {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [userRole, setUserRole] = useState<OrgRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOrganization = useCallback(async () => {
    if (!orgSlug || !userId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Query organization by slug
      const orgsRef = collection(db, 'organizations');
      const q = query(orgsRef, where('slug', '==', orgSlug));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        setError('Organization not found');
        setOrganization(null);
        setUserRole(null);
        return;
      }

      const orgDoc = snapshot.docs[0];
      const orgData = { id: orgDoc.id, ...orgDoc.data() } as Organization;

      // Check if user is a member
      const memberRole = orgData.members?.[userId];
      if (!memberRole) {
        setError('You are not a member of this organization');
        setOrganization(null);
        setUserRole(null);
        return;
      }

      setOrganization(orgData);
      setUserRole(memberRole);
    } catch (err) {
      console.error('Error loading organization:', err);
      setError('Failed to load organization');
    } finally {
      setIsLoading(false);
    }
  }, [orgSlug, userId]);

  useEffect(() => {
    loadOrganization();
  }, [loadOrganization]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!organization?.id) return;

    const unsubscribe = onSnapshot(
      doc(db, 'organizations', organization.id),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = { id: snapshot.id, ...snapshot.data() } as Organization;
          setOrganization(data);
          // Update role if it changed
          if (userId && data.members?.[userId]) {
            setUserRole(data.members[userId]);
          }
        }
      },
      (err) => {
        console.error('Organization subscription error:', err);
      }
    );

    return () => unsubscribe();
  }, [organization?.id, userId]);

  const checkPermission = useCallback((permission: OrgPermission) => {
    return hasPermission(userRole, permission);
  }, [userRole]);

  return {
    organization,
    userRole,
    isLoading,
    error,
    hasPermission: checkPermission,
    refreshOrganization: loadOrganization
  };
}

// Hook to get user's organizations
export function useUserOrganizations(userId: string | null) {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setOrganizations([]);
      setIsLoading(false);
      return;
    }

    const loadUserOrgs = async () => {
      try {
        // Get all organizations where user is a member
        const orgsRef = collection(db, 'organizations');
        const snapshot = await getDocs(orgsRef);

        const userOrgs: Organization[] = [];
        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          if (data.members && data.members[userId]) {
            userOrgs.push({ id: doc.id, ...data } as Organization);
          }
        });

        setOrganizations(userOrgs);
      } catch (err) {
        console.error('Error loading user organizations:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserOrgs();
  }, [userId]);

  return { organizations, isLoading };
}

// Create Clarvida organization (run once)
export async function createClarvidaOrganization(ownerId: string): Promise<Organization> {
  const orgId = 'clarvida';
  const orgRef = doc(db, 'organizations', orgId);

  const existingOrg = await getDoc(orgRef);
  if (existingOrg.exists()) {
    return { id: orgId, ...existingOrg.data() } as Organization;
  }

  const clarvidaOrg: Omit<Organization, 'id'> = {
    name: 'Clarvida',
    slug: 'clarvida',
    owner_id: ownerId,
    members: {
      [ownerId]: 'owner'
    },
    branding: {
      logo_url: '/lovable-uploads/a36a9030-18dd-4eec-bf47-21de5406f97b.png',
      primary_color: '#8B5CF6',
      secondary_color: '#A18472',
      name: 'Clarvida'
    },
    settings: {
      allowed_domains: ['clarvida.com'],
      require_approval: false,
      invite_only: true
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  await setDoc(orgRef, clarvidaOrg);

  return { id: orgId, ...clarvidaOrg };
}

// Add user to organization
export async function addUserToOrganization(
  organizationId: string,
  userId: string,
  role: OrgRole,
  invitedBy?: string
): Promise<void> {
  const orgRef = doc(db, 'organizations', organizationId);
  const orgSnap = await getDoc(orgRef);

  if (!orgSnap.exists()) {
    throw new Error('Organization not found');
  }

  const orgData = orgSnap.data();
  const updatedMembers = {
    ...orgData.members,
    [userId]: role
  };

  await setDoc(orgRef, {
    ...orgData,
    members: updatedMembers,
    updated_at: new Date().toISOString()
  });

  // Also create user_organizations record for querying
  const userOrgRef = doc(collection(db, 'user_organizations'));
  await setDoc(userOrgRef, {
    user_id: userId,
    organization_id: organizationId,
    role,
    joined_at: new Date().toISOString(),
    invited_by: invitedBy || null
  });
}
