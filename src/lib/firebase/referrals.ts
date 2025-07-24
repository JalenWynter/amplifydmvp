
// This file contains client-side functions for interacting with Referral data.
import { collection, query, orderBy, where, getDocs } from "firebase/firestore";
import { db } from "./client";
import { httpsCallable } from "firebase/functions";
import { getFirebaseFunctions } from "./client";
import { REFERRAL_CODE_STATUS, REFERRAL_EARNING_STATUS } from '../constants';
import type { ReferralCode, ReferralEarning, ReferralStats, User } from "@/lib/types";
import { getUsers } from './users'; // Assuming getUsers is in users.ts



export async function createReferralCode(associatedUser: string, referrerId: string): Promise<{ success: boolean, code: string, message: string }> {
    console.log(`Calling createReferralCode Cloud Function for ${associatedUser}...`);
    const functions = getFirebaseFunctions();
    const createReferralCodeCallable = httpsCallable(functions, 'createReferralCode');

    try {
        const result = await createReferralCodeCallable({ associatedUser, referrerId });
        return result.data as { success: boolean, code: string, message: string };
    } catch (error: unknown) {
        console.error("Error calling createReferralCode Cloud Function:", error);
        let errorMessage = "An unknown error occurred.";
        if (error instanceof Error) {
            errorMessage = error.message;
        } else if (typeof error === "object" && error !== null && "message" in error) {
            errorMessage = (error as { message: string }).message;
        }
        throw new Error(`Failed to create referral code: ${errorMessage}`);
    }
}

export async function getReferralCodes(): Promise<ReferralCode[]> {
    console.log("Fetching all referral codes from Firestore...");
    const codesCol = collection(db, "referralCodes");
    const q = query(codesCol, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    
    const codes = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as ReferralCode));
    
    return codes;
}

export async function getAllReferralCodes(): Promise<ReferralCode[]> {
    console.log("Fetching all referral codes for admin...");
    const codesCol = collection(db, "referralCodes");
    const q = query(codesCol, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    
    const codes = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as ReferralCode));
    
    return codes;
}

export async function getReferralCodesByReferrer(referrerId: string): Promise<ReferralCode[]> {
    const codesCol = collection(db, "referralCodes");
    const q = query(codesCol, where("referrerId", "==", referrerId), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as ReferralCode));
}

export async function getReferralEarnings(userId?: string): Promise<ReferralEarning[]> {
    console.log(`Fetching referral earnings${userId ? ` for user ${userId}` : ' for all users'}...`);
    const earningsCol = collection(db, "referralEarnings");
    
    let q;
    if (userId === 'all' || !userId) {
        q = query(earningsCol, orderBy("createdAt", "desc"));
    } else {
        q = query(earningsCol, where("referrerId", "==", userId), orderBy("createdAt", "desc"));
    }
    
    const querySnapshot = await getDocs(q);
    
    const earnings = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as ReferralEarning));
    
    return earnings;
}

export async function getReferralStats(userId: string): Promise<ReferralStats> {
    console.log(`Calculating referral stats for user ${userId}...`);
    
    const [referralCodes, referralEarnings] = await Promise.all([
        getReferralCodes(), // Get user's referral codes
        getReferralEarnings(userId) // Get user's referral earnings
    ]);
    
    const userCodes = referralCodes.filter(code => code.associatedUser === userId);
    const totalReferrals = userCodes.filter(code => code.status === REFERRAL_CODE_STATUS.USED).length;
    const activeReferrals = userCodes.filter(code => code.status === REFERRAL_CODE_STATUS.ACTIVE).length;
    
    const totalEarnings = referralEarnings.reduce((sum, earning) => sum + earning.commissionAmount, 0);
    const pendingEarnings = referralEarnings.filter(e => e.status === 'pending').reduce((sum, earning) => sum + earning.commissionAmount, 0);
    const paidEarnings = referralEarnings.filter(e => e.status === 'paid').reduce((sum, earning) => sum + earning.commissionAmount, 0);
    
    const conversionRate = userCodes.length > 0 ? (totalReferrals / userCodes.length) * 100 : 0;
    
    return {
        totalReferrals,
        activeReferrals,
        totalEarnings,
        pendingEarnings,
        conversionRate
    };
}

export async function getCodesCreatedToday(userId: string): Promise<number> {
    console.log(`Checking codes created today for user ${userId}...`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();
    
    const codesCol = collection(db, "referralCodes");
    const q = query(codesCol, where("associatedUser", "==", userId), where("createdAt", ">=", todayISO));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.size;
}

export async function getUserReferralHistory(userId: string): Promise<{
    referralCodes: ReferralCode[];
    referralEarnings: ReferralEarning[];
}> {
    console.log(`Fetching referral history for user ${userId}...`);
    
    const [referralCodes, referralEarnings] = await Promise.all([
        getReferralCodes(), // Get user's referral codes
        getReferralEarnings(userId) // Get user's referral earnings
    ]);
    
    const userCodes = referralCodes.filter(code => code.associatedUser === userId);
    
    return {
        referralCodes: userCodes,
        referralEarnings
    };
}

export async function getReferralTrackingChain(userId: string): Promise<any> {
    console.log(`Fetching referral tracking chain for user ${userId}...`);
    // This is a placeholder. Actual implementation would involve
    // traversing referral relationships in Firestore.
    return {};
}
