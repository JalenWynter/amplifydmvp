// src/app/admin/users/actions.ts
'use server';

import { updateUserStatus } from '@/lib/firebase/admin/users';
import { User } from '@/lib/types';

export async function handleUserStatusUpdate(userId: string, status: User['status']) {
  try {
    await updateUserStatus(userId, status);
    return { success: true };
  } catch (error) {
    console.error('Error in Server Action handleUserStatusUpdate:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, error: errorMessage };
  }
}
