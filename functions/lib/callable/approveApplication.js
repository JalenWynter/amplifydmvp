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
exports.approveApplication = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
exports.approveApplication = (0, https_1.onCall)(async (request) => {
    var _a;
    // Check if user is admin
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Authentication required.');
    }
    // Get user role from Firestore
    const userDoc = await admin.firestore().collection('users').doc(request.auth.uid).get();
    if (!userDoc.exists || ((_a = userDoc.data()) === null || _a === void 0 ? void 0 : _a.role) !== 'admin') {
        throw new https_1.HttpsError('permission-denied', 'Only admins can approve applications.');
    }
    const { applicationId } = request.data;
    if (!applicationId) {
        throw new https_1.HttpsError('invalid-argument', 'Application ID is required.');
    }
    try {
        // Get the application
        const applicationRef = admin.firestore().collection('applications').doc(applicationId);
        const applicationDoc = await applicationRef.get();
        if (!applicationDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Application not found.');
        }
        const applicationData = applicationDoc.data();
        // Update application status
        await applicationRef.update({
            status: 'approved',
            reviewedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        // Create user account and reviewer profile
        const userId = `reviewer_${applicationId}_${Date.now()}`;
        // Create user document
        await admin.firestore().collection('users').doc(userId).set({
            id: userId,
            email: applicationData === null || applicationData === void 0 ? void 0 : applicationData.email,
            name: applicationData === null || applicationData === void 0 ? void 0 : applicationData.name,
            role: 'reviewer',
            status: 'Active',
            joinedAt: admin.firestore.FieldValue.serverTimestamp(),
            avatarUrl: '/USETHIS.png',
        });
        // Create reviewer profile
        await admin.firestore().collection('reviewers').doc(userId).set({
            id: userId,
            name: applicationData === null || applicationData === void 0 ? void 0 : applicationData.name,
            avatarUrl: '/USETHIS.png',
            dataAiHint: 'professional portrait',
            turnaround: '3-5 days',
            genres: [(applicationData === null || applicationData === void 0 ? void 0 : applicationData.primaryRole) || 'General'],
            experience: (applicationData === null || applicationData === void 0 ? void 0 : applicationData.musicBackground) || '',
            packages: [
                {
                    id: `pkg_${userId}_01`,
                    name: 'Standard Review',
                    priceInCents: 2500,
                    description: 'Detailed feedback on your track.',
                    trackCount: 1,
                    formats: ['written', 'chart']
                }
            ],
        });
        return { success: true, message: 'Application approved and reviewer account created successfully.' };
    }
    catch (error) {
        console.error('Error approving application:', error);
        throw new https_1.HttpsError('internal', 'Failed to approve application.');
    }
});
//# sourceMappingURL=approveApplication.js.map