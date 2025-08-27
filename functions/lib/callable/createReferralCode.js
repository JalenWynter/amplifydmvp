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
exports.createReferralCode = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const uuid_1 = require("uuid");
exports.createReferralCode = (0, https_1.onCall)(async (request) => {
    var _a;
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Authentication required.');
    }
    // Get user role from Firestore
    const userDoc = await admin.firestore().collection('users').doc(request.auth.uid).get();
    if (!userDoc.exists || ((_a = userDoc.data()) === null || _a === void 0 ? void 0 : _a.role) !== 'admin') {
        throw new https_1.HttpsError('permission-denied', 'Only admins can create referral codes.');
    }
    const { associatedUser, referrerId } = request.data;
    if (!associatedUser || !referrerId) {
        throw new https_1.HttpsError('invalid-argument', 'Missing associatedUser or referrerId.');
    }
    try {
        const code = `INVITE-${(0, uuid_1.v4)().slice(0, 8).toUpperCase()}`;
        await admin.firestore().collection('referralCodes').add({
            code: code,
            referrerId: referrerId,
            associatedUser: associatedUser,
            status: 'Active',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return { success: true, code: code, message: 'Referral code created successfully.' };
    }
    catch (error) {
        console.error('Error creating referral code:', error);
        throw new https_1.HttpsError('internal', 'Failed to create referral code.');
    }
});
//# sourceMappingURL=createReferralCode.js.map