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
exports.getSubmissionsForReviewer = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
exports.getSubmissionsForReviewer = (0, https_1.onCall)(async (request) => {
    // Verify authentication
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Must be authenticated to access submissions');
    }
    const reviewerId = request.auth.uid;
    try {
        // Verify user is a reviewer
        const userDoc = await admin.firestore().collection('users').doc(reviewerId).get();
        if (!userDoc.exists) {
            throw new https_1.HttpsError('permission-denied', 'User not found');
        }
        const userData = userDoc.data();
        if ((userData === null || userData === void 0 ? void 0 : userData.role) !== 'Reviewer' && (userData === null || userData === void 0 ? void 0 : userData.role) !== 'Admin') {
            throw new https_1.HttpsError('permission-denied', 'Only reviewers can access submissions');
        }
        // Get submissions assigned to this reviewer
        const submissionsRef = admin.firestore().collection('submissions');
        const snapshot = await submissionsRef
            .where('reviewerId', '==', reviewerId)
            .where('status', '==', 'Pending Review')
            .orderBy('submittedAt', 'desc')
            .get();
        const submissions = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                artistName: data.artistName,
                songTitle: data.songTitle,
                genre: data.genre,
                audioUrl: data.audioUrl,
                submittedAt: data.submittedAt,
                status: data.status,
                contactEmail: data.contactEmail,
                packageId: data.packageId
            };
        });
        console.log(`Retrieved ${submissions.length} pending submissions for reviewer ${reviewerId}`);
        return { submissions };
    }
    catch (error) {
        console.error('Error fetching submissions for reviewer:', error);
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        throw new https_1.HttpsError('internal', 'Failed to fetch submissions');
    }
});
//# sourceMappingURL=getSubmissionsForReviewer.js.map