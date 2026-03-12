import { useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { uploadAvatar } from '@/lib/firebase-storage';
import { normalizeTimestamp } from '@/lib/timestamp';
import { toast } from 'sonner';
import type { ProfileData } from '@/types/profile';

export function useProfileData(userId: string | undefined) {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingName, setEditingName] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const fetchProfileData = async () => {
    if (!userId) return;

    try {
      if (!db) {
        console.warn("[Profile] Firestore not initialized");
        return;
      }

      const profileRef = doc(db, 'profiles', userId);
      const profileSnap = await getDoc(profileRef);

      if (!profileSnap.exists()) {
        setProfileData(null);
        setEditingName("");
        return;
      }

      const data = profileSnap.data() as ProfileData;
      const normalizedProfile: ProfileData = {
        ...data,
        created_at: normalizeTimestamp(data.created_at),
        updated_at: normalizeTimestamp(data.updated_at)
      };
      setProfileData(normalizedProfile);
      setEditingName(normalizedProfile.full_name || "");
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error("Failed to load profile data");
    }
  };

  const handleUpdateProfile = async () => {
    if (!userId || !profileData) return;

    try {
      if (!db) {
        throw new Error('Firestore not initialized');
      }

      const profileRef = doc(db, 'profiles', userId);
      await updateDoc(profileRef, {
        full_name: editingName,
        updated_at: new Date().toISOString()
      });

      setProfileData({ ...profileData, full_name: editingName });
      setEditModalOpen(false);
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error("Failed to update profile");
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !userId) return;

    const file = e.target.files[0];

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error("Please upload a valid image file (JPEG, PNG, GIF, or WebP)");
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    setUploadingAvatar(true);

    try {
      const avatarUrl = await uploadAvatar(userId, file, (progress) => {
        console.log(`Upload progress: ${progress}%`);
      });

      if (!db) {
        throw new Error('Firestore not initialized');
      }

      const profileRef = doc(db, 'profiles', userId);
      await updateDoc(profileRef, {
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString()
      });

      if (profileData) {
        setProfileData({ ...profileData, avatar_url: avatarUrl });
      }

      toast.success("Avatar updated successfully");
    } catch (error) {
      console.error('Error uploading avatar:', error);

      let errorMessage = "Failed to upload avatar";
      if (error instanceof Error) {
        if (error.message.includes('not authenticated')) {
          errorMessage = "Please sign in again to upload an avatar";
        } else if (error.message.includes('quota exceeded')) {
          errorMessage = "Storage quota exceeded. Please try again later";
        } else if (error.message.includes('unauthorized')) {
          errorMessage = "You don't have permission to upload files";
        } else if (error.message.includes('invalid format')) {
          errorMessage = "Invalid image format. Please use JPEG, PNG, GIF, or WebP";
        }
      }

      toast.error(errorMessage);
    } finally {
      setUploadingAvatar(false);
    }
  };

  return {
    profileData,
    editModalOpen,
    setEditModalOpen,
    editingName,
    setEditingName,
    uploadingAvatar,
    fetchProfileData,
    handleUpdateProfile,
    handleAvatarUpload,
  };
}
