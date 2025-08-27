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
exports.getSignedUploadUrl = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
exports.getSignedUploadUrl = (0, https_1.onCall)(async (request) => {
    const { fileName, contentType } = request.data;
    if (!fileName || !contentType) {
        throw new https_1.HttpsError('invalid-argument', "The function must be called with a 'fileName' and 'contentType'.");
    }
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const filePath = `music-uploads/temp/${timestamp}-${randomId}-${fileName}`;
    const bucket = admin.storage().bucket();
    const bucketName = bucket.name;
    const uploadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(filePath)}?uploadType=media`;
    console.log(`Generated upload path for anonymous user: ${filePath}`);
    return {
        success: true,
        filePath: filePath,
        url: uploadUrl,
        contentType: contentType,
        message: 'Upload directly to Firebase Storage using the provided URL',
    };
});
//# sourceMappingURL=getSignedUploadUrl.js.map