import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { storage } from './config'

/**
 * Upload a user avatar image
 * @param uid User ID
 * @param file The image file to upload
 * @returns The download URL of the uploaded image
 */
export async function uploadUserAvatar(uid: string, file: File): Promise<string> {
  // Create a reference to the avatar file
  const avatarRef = ref(storage, `avatars/${uid}`)

  // Upload the file
  await uploadBytes(avatarRef, file, {
    contentType: file.type,
  })

  // Get and return the download URL
  const downloadURL = await getDownloadURL(avatarRef)
  return downloadURL
}

/**
 * Delete a user's avatar from storage
 * @param uid User ID
 */
export async function deleteUserAvatar(uid: string): Promise<void> {
  const avatarRef = ref(storage, `avatars/${uid}`)
  try {
    await deleteObject(avatarRef)
  } catch {
    // Ignore errors if the file doesn't exist
  }
}
