"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdminDashboardStats = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
exports.getAdminDashboardStats = (0, https_1.onCall)(async (request) => {
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
        const totalRevenue = transactions.reduce((sum, t) => sum + (t.type === 'submission_payment' && t.status === 'succeeded' ? t.amount : 0), 0);
        console.log(`Admin stats: ${totalUsers} users, ${totalReviewers} reviewers, ${totalSubmissions} submissions, ${completedReviews} reviews, $${totalRevenue / 100} revenue`);
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
    }
    catch (error) {
        console.error("Error fetching admin dashboard stats:", error);
        throw new Error(`Failed to fetch admin stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
});
//# sourceMappingURL=getAdminDashboardStats.js.map