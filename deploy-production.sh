#!/bin/bash

# Production Deployment Script for Amplifyd
# This script deploys the production-ready security rules and configurations

echo "🚀 Deploying Amplifyd to Production"
echo "=================================="

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI is not installed. Please install it first:"
    echo "npm install -g firebase-tools"
    exit 1
fi

# Check if logged in to Firebase
if ! firebase projects:list &> /dev/null; then
    echo "❌ Not logged in to Firebase. Please run:"
    echo "firebase login"
    exit 1
fi

echo "✅ Firebase CLI is ready"

# Backup current rules
echo "📦 Backing up current rules..."
cp firestore.rules firestore.rules.backup
cp storage.rules storage.rules.backup
echo "✅ Rules backed up"

# Deploy production rules
echo "🔒 Deploying production Firestore rules..."
cp firestore.rules.production firestore.rules
firebase deploy --only firestore:rules

echo "🗂️ Deploying production Storage rules..."
cp storage.rules.production storage.rules
firebase deploy --only storage

echo "📊 Deploying Firestore indexes..."
firebase deploy --only firestore:indexes

echo "🏗️ Building Next.js application..."
npm run build

echo "🌐 Deploying to Firebase Hosting..."
firebase deploy --only hosting

echo "✅ Production deployment complete!"

# Restore original rules for development
echo "🔄 Restoring development rules..."
cp firestore.rules.backup firestore.rules
cp storage.rules.backup storage.rules
rm firestore.rules.backup storage.rules.backup

echo "=================================="
echo "🎉 Production Deployment Summary:"
echo "- Firestore rules: ✅ Deployed"
echo "- Storage rules: ✅ Deployed"
echo "- Indexes: ✅ Deployed"
echo "- Next.js app: ✅ Built & Deployed"
echo "- Development rules: ✅ Restored"
echo "=================================="

echo "🔗 Your app is now live at:"
firebase hosting:channel:list

echo "⚠️  IMPORTANT: Remember to:"
echo "1. Set production environment variables"
echo "2. Configure Stripe live keys"
echo "3. Set up monitoring and alerts"
echo "4. Test all functionality in production"
echo "5. Update CORS settings for production domain" 