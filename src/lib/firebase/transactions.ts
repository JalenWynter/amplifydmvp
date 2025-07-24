
// This file contains client-side functions for interacting with Transaction data.
import { collection, getDocs, doc, addDoc, updateDoc, query, orderBy, where } from "firebase/firestore";
import { db } from "./client";
import { TRANSACTION_STATUS } from '../constants';
import type { Transaction } from '../types';

export async function createTransaction(transactionData: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const now = new Date().toISOString();
  const transaction: Omit<Transaction, 'id'> = {
    ...transactionData,
    createdAt: now,
    updatedAt: now,
  };
  try {
    const docRef = await addDoc(collection(db, 'transactions'), transaction);
    return docRef.id;
  } catch (error: unknown) {
    console.error("Error creating transaction:", error);
    let errorMessage = "An unknown error occurred.";
    if (error instanceof Error) {
        errorMessage = error.message;
    } else if (typeof error === "object" && error !== null && "message" in error) {
        errorMessage = (error as { message: string }).message;
    }
    throw new Error(`Failed to create transaction: ${errorMessage}`);
  }
}

export async function getTransactions(): Promise<Transaction[]> {
  console.log("Fetching all transactions from Firestore...");
  const transactionsCol = collection(db, "transactions");
  const q = query(transactionsCol, orderBy("createdAt", "desc"));
  const querySnapshot = await getDocs(q);
  
  const transactions = querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Transaction));
  
  return transactions;
}

export async function getTransactionStats(): Promise<{
  successfulTransactions: number;
  totalTransactions: number;
  conversionRate: number;
  failedTransactions: number;
}> {
  console.log("Calculating transaction statistics...");
  const transactions = await getTransactions();
  
  const totalTransactions = transactions.length;
  const successfulTransactions = transactions.filter(t => t.status === TRANSACTION_STATUS.COMPLETED).length;
  const failedTransactions = transactions.filter(t => t.status === TRANSACTION_STATUS.FAILED).length;
  const conversionRate = totalTransactions > 0 ? (successfulTransactions / totalTransactions) * 100 : 0;
  
  return {
    successfulTransactions,
    totalTransactions,
    conversionRate,
    failedTransactions
  };
}

export async function getTransactionBySessionId(sessionId: string): Promise<Transaction | null> {
  console.log(`Fetching transaction with session ID: ${sessionId}`);
  const transactionsCol = collection(db, "transactions");
  const q = query(transactionsCol, where("stripeSessionId", "==", sessionId));
  const querySnapshot = await getDocs(q);
  
  if (querySnapshot.empty) {
    return null;
  }
  
  const doc = querySnapshot.docs[0];
  return {
    id: doc.id,
    ...doc.data()
  } as Transaction;
}

export async function updateTransactionStatus(
  transactionId: string, 
  status: typeof TRANSACTION_STATUS[keyof typeof TRANSACTION_STATUS],
  additionalData?: Partial<Transaction>
): Promise<void> {
  console.log(`Updating transaction ${transactionId} status to ${status}`);
  const transactionRef = doc(db, "transactions", transactionId);
  
  const updateData: Partial<Transaction> = {
    status,
    updatedAt: new Date().toISOString(),
    ...additionalData
  };
  try {
    await updateDoc(transactionRef, updateData);
  } catch (error: unknown) {
    console.error("Error updating transaction status:", error);
    let errorMessage = "An unknown error occurred.";
    if (error instanceof Error) {
        errorMessage = error.message;
    } else if (typeof error === "object" && error !== null && "message" in error) {
        errorMessage = (error as { message: string }).message;
    }
    throw new Error(`Failed to update transaction status: ${errorMessage}`);
  }
}
