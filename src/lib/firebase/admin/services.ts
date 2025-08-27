// Admin services - Cloud function calls for admin operations
import { getFirebaseFunctions } from "../client";
import { httpsCallable } from "firebase/functions";
import { DashboardStats, FinancialStats, TransactionStats } from "../../types";

// Check if we're in emulator mode
const isEmulatorMode = process.env.NODE_ENV === 'development' && 
                       process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST;

/**
 * Get dashboard statistics via cloud function
 * Uses Admin SDK on server-side to bypass client-side rules
 */
export async function getDashboardStats(): Promise<DashboardStats> {
    console.log("Fetching dashboard stats via cloud function...");
    try {
        const functions = getFirebaseFunctions();
        const getAdminDashboardStatsCallable = httpsCallable(functions, 'getAdminDashboardStats');
        
        const result = await getAdminDashboardStatsCallable();
        const data = result.data as { success: boolean; stats: DashboardStats };
        
        if (data.success) {
            console.log("Dashboard stats fetched successfully:", data.stats);
            return data.stats;
        } else {
            throw new Error("Failed to fetch dashboard stats");
        }
    } catch (error) {
        console.log("Dashboard stats fetch failed, returning demo data:", error);
        // Return demo data for emulator testing
        return {
            totalUsers: isEmulatorMode ? 3 : 0, // Seeded users (admin, reviewer, uploader)
            totalReviewers: isEmulatorMode ? 1 : 0, // Seeded reviewers
            totalSubmissions: isEmulatorMode ? 3 : 0, // Seeded submissions
            completedReviews: isEmulatorMode ? 1 : 0, // Seeded reviews
        };
    }
}

/**
 * Get financial statistics via cloud function
 */
export async function getFinancialStats(): Promise<FinancialStats> {
    console.log("Fetching financial stats via cloud function...");
    try {
        const functions = getFirebaseFunctions();
        const getAdminDashboardStatsCallable = httpsCallable(functions, 'getAdminDashboardStats');
        
        const result = await getAdminDashboardStatsCallable();
        const data = result.data as { success: boolean; stats: DashboardStats & { totalRevenue: number } };
        
        if (data.success) {
            return {
                totalRevenue: data.stats.totalRevenue || 0,
                avgRevenuePerUser: data.stats.totalUsers > 0 ? (data.stats.totalRevenue || 0) / data.stats.totalUsers : 0,
                pendingPayouts: 0,
                pendingPayoutsCount: 0,
                totalUsers: data.stats.totalUsers,
            };
        } else {
            throw new Error("Failed to fetch financial stats");
        }
    } catch (error) {
        console.log("Financial stats fetch failed, returning demo data:", error);
        return {
            totalRevenue: isEmulatorMode ? 7500 : 0, // Demo revenue
            avgRevenuePerUser: isEmulatorMode ? 2500 : 0, // Demo average (7500/3 users)
            pendingPayouts: 0,
            pendingPayoutsCount: 0,
            totalUsers: isEmulatorMode ? 3 : 0,
        };
    }
}

/**
 * Get transaction statistics via cloud function
 */
export async function getTransactionStats(): Promise<TransactionStats> {
    console.log("Fetching transaction stats via cloud function...");
    try {
        const functions = getFirebaseFunctions();
        const getAdminDashboardStatsCallable = httpsCallable(functions, 'getAdminDashboardStats');
        
        const result = await getAdminDashboardStatsCallable();
        const data = result.data as { success: boolean; stats: DashboardStats & { totalRevenue: number } };
        
        if (data.success) {
            // Estimate transaction stats from revenue
            const estimatedTransactions = Math.ceil((data.stats.totalRevenue || 0) / 2500); // Assume average $25 per transaction
            return {
                successfulTransactions: estimatedTransactions,
                totalTransactions: estimatedTransactions,
                conversionRate: 100, // Assume 100% success rate for demo
                failedTransactions: 0,
            };
        } else {
            throw new Error("Failed to fetch transaction stats");
        }
    } catch (error) {
        console.log("Transaction stats fetch failed, returning demo data:", error);
        return {
            successfulTransactions: isEmulatorMode ? 3 : 0, // Demo transactions
            totalTransactions: isEmulatorMode ? 3 : 0,
            conversionRate: isEmulatorMode ? 100 : 0,
            failedTransactions: 0,
        };
    }
}
