import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../client";
import { DashboardStats, FinancialStats, TransactionStats, User, Submission, Payout, Transaction, ReferralEarning, ActivityEvent } from "../../types";

export async function getDashboardStats(): Promise<DashboardStats> {
    console.log("Fetching dashboard stats...");
    try {
        const usersSnapshot = await getDocs(collection(db, "users"));
        const submissionsSnapshot = await getDocs(collection(db, "submissions"));
        const reviewsSnapshot = await getDocs(collection(db, "reviews"));

        const totalUsers = usersSnapshot.size;
        const totalReviewers = usersSnapshot.docs.filter(doc => (doc.data() as User).role === 'reviewer').length;
        const totalSubmissions = submissionsSnapshot.size;
        const completedReviews = reviewsSnapshot.size;

        return {
            totalUsers,
            totalReviewers,
            totalSubmissions,
            completedReviews,
        };
    } catch (error: unknown) {
        console.error("Error fetching dashboard stats:", error);
        let errorMessage = "An unknown error occurred.";
        if (error instanceof Error) {
            errorMessage = error.message;
        } else if (typeof error === "object" && error !== null && "message" in error) {
            errorMessage = (error as { message: string }).message;
        }
        throw new Error(`Failed to fetch dashboard stats: ${errorMessage}`);
    }
}

export async function getFinancialStats(): Promise<FinancialStats> {
    console.log("Fetching financial stats...");
    try {
        const transactionsSnapshot = await getDocs(collection(db, "transactions"));
        const payoutsSnapshot = await getDocs(collection(db, "payouts"));
        const usersSnapshot = await getDocs(collection(db, "users"));

        const transactions = transactionsSnapshot.docs.map(doc => doc.data() as Transaction);
        const payouts = payoutsSnapshot.docs.map(doc => doc.data() as Payout);

        const totalRevenue = transactions.reduce((sum, t) => sum + (t.type === 'submission_payment' && t.status === 'succeeded' ? t.amount : 0), 0);
        const pendingPayouts = payouts.filter(p => p.status === 'Pending').reduce((sum, p) => sum + p.amountInCents, 0);
        const pendingPayoutsCount = payouts.filter(p => p.status === 'Pending').length;
        const totalUsers = usersSnapshot.size;
        const avgRevenuePerUser = totalUsers > 0 ? totalRevenue / totalUsers : 0;

        return {
            totalRevenue,
            avgRevenuePerUser,
            pendingPayouts,
            pendingPayoutsCount,
            totalUsers,
        };
    } catch (error: unknown) {
        console.error("Error fetching financial stats:", error);
        let errorMessage = "An unknown error occurred.";
        if (error instanceof Error) {
            errorMessage = error.message;
        } else if (typeof error === "object" && error !== null && "message" in error) {
            errorMessage = (error as { message: string }).message;
        }
        throw new Error(`Failed to fetch financial stats: ${errorMessage}`);
    }
}

export async function getTransactionStats(): Promise<TransactionStats> {
    console.log("Fetching transaction stats...");
    try {
        const transactionsSnapshot = await getDocs(collection(db, "transactions"));
        const transactions = transactionsSnapshot.docs.map(doc => doc.data() as Transaction);

        const totalTransactions = transactions.length;
        const successfulTransactions = transactions.filter(t => t.status === 'succeeded').length;
        const failedTransactions = transactions.filter(t => t.status === 'failed').length;
        const conversionRate = totalTransactions > 0 ? (successfulTransactions / totalTransactions) * 100 : 0;

        return {
            successfulTransactions,
            totalTransactions,
            conversionRate,
            failedTransactions,
        };
    } catch (error: unknown) {
        console.error("Error fetching transaction stats:", error);
        let errorMessage = "An unknown error occurred.";
        if (error instanceof Error) {
            errorMessage = error.message;
        } else if (typeof error === "object" && error !== null && "message" in error) {
            errorMessage = (error as { message: string }).message;
        }
        throw new Error(`Failed to fetch transaction stats: ${errorMessage}`);
    }
}
