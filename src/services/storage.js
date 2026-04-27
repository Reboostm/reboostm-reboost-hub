import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { storage } from './firebase'

export async function uploadFile(path, file) {
  const storageRef = ref(storage, path)
  const snap = await uploadBytes(storageRef, file)
  return getDownloadURL(snap.ref)
}

export async function uploadUserLogo(uid, file) {
  return uploadFile(`users/${uid}/logo/${file.name}`, file)
}

export async function uploadUserPhoto(uid, file) {
  return uploadFile(`users/${uid}/photos/${Date.now()}_${file.name}`, file)
}

export async function uploadCalendarImage(id, file) {
  return uploadFile(`calendar/${id}/${file.name}`, file)
}

export async function deleteFile(url) {
  const fileRef = ref(storage, url)
  await deleteObject(fileRef)
}
