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
exports.submitApplication = void 0;
const admin = __importStar(require("firebase-admin"));
const https_1 = require("firebase-functions/v2/https");
exports.submitApplication = (0, https_1.onCall)(async (request) => {
    const { name, email, primaryRole, portfolioLink, musicBackground, joinReason, referral } = request.data;
    if (!name || !email || !primaryRole || !musicBackground || !joinReason) {
        throw new https_1.HttpsError('invalid-argument', 'Missing required application fields.');
    }
    try {
        await admin.firestore().collection('applications').add({
            name: name,
            email: email,
            primaryRole: primaryRole,
            portfolioLink: portfolioLink || '',
            musicBackground: musicBackground,
            joinReason: joinReason,
            referral: referral || '',
            status: 'pending',
            submittedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return { success: true, message: 'Application submitted successfully.' };
    }
    catch (error) {
        console.error('Error submitting application:', error);
        throw new https_1.HttpsError('internal', 'Failed to submit application.', error);
    }
});
//# sourceMappingURL=submitApplication.js.map