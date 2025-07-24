import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./client";
import { v4 as uuidv4 } from 'uuid';

export async function uploadFile(file: File, path: string): Promise<string> {
  const fileName = `${uuidv4()}-${file.name}`;
  const fileRef = ref(storage, `${path}/${fileName}`);

  try {
    const snapshot = await uploadBytes(fileRef, file);
    const downloadUrl = await getDownloadURL(snapshot.ref);
    console.log("File uploaded successfully. Download URL:", downloadUrl);
    return downloadUrl;
  } catch (error) {
    console.error("Error uploading file:", error);
    throw new Error(`Failed to upload file: ${error.message}`);
  }
}
