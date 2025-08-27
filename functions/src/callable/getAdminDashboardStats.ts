import { onCall } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

const db = admin.firestore();

export const getAdminDashboardStats = onCall(async (request) => {
    try {
        console.log("Admin dashboard stats requested");

        // In emulator mode, allow any authenticated user
        // In production, this would check for admin role
        const isEmulatorMode = process.env.FUNCTIONS_EMULATOR === 'true';
        
        if (!isEmulatorMode && (!request.auth || request.auth.token.role !== 'admin')) {
            throw new Error('Unauthorized: Admin access required');
        }

        // Fetch all data using Admin SDK (bypasses client-side rules)
        const [usersSnapshot, submissionsSnapshot, reviewsSnapshot, transactionsSnapshot] = await Promise.all([
            db.collection("users").get(),
            db.collection("submissions").get(),
            db.collection("reviews").get(),
            db.collection("transactions").get()
        ]);

        const totalUsers = usersSnapshot.size;
        const totalReviewers = usersSnapshot.docs.filter(doc => doc.data().role === 'reviewer').length;
        const totalSubmissions = submissionsSnapshot.size;
        const completedReviews = reviewsSnapshot.size;

        // Calculate financial stats
        const transactions = transactionsSnapshot.docs.map(doc => doc.data());
        const totalRevenue = transactions.reduce((sum, t) => 
            sum + (t.type === 'submission_payment' && t.status === 'succeeded' ? t.amount : 0), 0
        );

        console.log(`Admin stats: ${totalUsers} users, ${totalReviewers} reviewers, ${totalSubmissions} submissions, ${completedReviews} reviews, $${totalRevenue/100} revenue`);

        return {
            success: true,
            stats: {
                totalUsers,
                totalReviewers,
                totalSubmissions,
                completedReviews,
                totalRevenue,
            }
        };

    } catch (error) {
        console.error("Error fetching admin dashboard stats:", error);
        throw new Error(`Failed to fetch admin stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
});
