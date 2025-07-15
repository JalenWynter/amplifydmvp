// src/app/admin/users/actions.ts
'use server';

import { updateUserStatusAdmin } from '@/lib/firebase/admin';
import { User } from '@/lib/firebase/services';

export async function handleUserStatusUpdate(userId: string, status: User['status']) {
  try {
    await updateUserStatusAdmin(userId, status);
    return { success: true };
  } catch (error) {
    console.error('Error in Server Action handleUserStatusUpdate:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, error: errorMessage };
  }
}
