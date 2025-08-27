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
exports.createSubmission = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
exports.createSubmission = (0, https_1.onCall)(async (request) => {
    const { artistName, songTitle, contactEmail, audioUrl, genre, reviewerId, packageId, paymentIntentId, amount, currency, stripeSessionId, packageName, packageDescription } = request.data;
    if (!artistName || !songTitle || !contactEmail || !audioUrl || !genre || !reviewerId || !packageId) {
        throw new Error("Missing required submission data");
    }
    try {
        const submissionsRef = db.collection("submissions");
        // Generate a unique tracking token
        const trackingToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        const submissionData = {
            artistName,
            songTitle,
            uploaderEmail: contactEmail,
            songUrl: audioUrl,
            genre,
            reviewerId,
            packageId,
            paymentIntentId: paymentIntentId || `demo_payment_${Date.now()}`,
            stripeSessionId: stripeSessionId || `demo_session_${Date.now()}`,
            amount: amount || 0,
            currency: currency || 'usd',
            packageName: packageName || 'Unknown Package',
            packageDescription: packageDescription || '',
            trackingToken,
            status: "pending",
            submittedAt: admin.firestore.FieldValue.serverTimestamp(),
            contactEmail: contactEmail,
            audioUrl: audioUrl,
        };
        const docRef = await submissionsRef.add(submissionData);
        console.log(`Submission created for ${songTitle} by ${artistName} with tracking token ${trackingToken}`);
        // Send notification email to reviewer (TODO: implement email service)
        const reviewerDoc = await db.collection("reviewers").doc(reviewerId).get();
        if (reviewerDoc.exists) {
            const reviewerData = reviewerDoc.data();
            const reviewerEmail = reviewerData === null || reviewerData === void 0 ? void 0 : reviewerData.email;
            const reviewerName = (reviewerData === null || reviewerData === void 0 ? void 0 : reviewerData.name) || "Reviewer";
            if (reviewerEmail) {
                console.log(`Reviewer ${reviewerName} (${reviewerEmail}) notified of new submission: ${songTitle} by ${artistName}`);
            }
        }
        return {
            success: true,
            submissionId: docRef.id,
            trackingToken,
            message: `Submission created successfully for ${songTitle} by ${artistName}`
        };
    }
    catch (error) {
        console.error("Error creating submission:", error);
        throw new Error(`Failed to create submission: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
});
//# sourceMappingURL=createSubmission.js.map