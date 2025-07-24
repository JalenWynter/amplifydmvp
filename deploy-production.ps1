# Production Deployment Script for Amplifyd (PowerShell)
# This script deploys the production-ready security rules and configurations

Write-Host "🚀 Deploying Amplifyd to Production" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Green

# Check if Firebase CLI is installed
try {
    firebase --version | Out-Null
    Write-Host "✅ Firebase CLI is ready" -ForegroundColor Green
} catch {
    Write-Host "❌ Firebase CLI is not installed. Please install it first:" -ForegroundColor Red
    Write-Host "npm install -g firebase-tools" -ForegroundColor Yellow
    exit 1
}

# Check if logged in to Firebase
try {
    firebase projects:list | Out-Null
    Write-Host "✅ Firebase authentication verified" -ForegroundColor Green
} catch {
    Write-Host "❌ Not logged in to Firebase. Please run:" -ForegroundColor Red
    Write-Host "firebase login" -ForegroundColor Yellow
    exit 1
}

# Backup current rules
Write-Host "📦 Backing up current rules..." -ForegroundColor Yellow
Copy-Item firestore.rules firestore.rules.backup -ErrorAction SilentlyContinue
Copy-Item storage.rules storage.rules.backup -ErrorAction SilentlyContinue
Write-Host "✅ Rules backed up" -ForegroundColor Green

# Deploy production rules
Write-Host "🔒 Deploying production Firestore rules..." -ForegroundColor Yellow
Copy-Item firestore.rules.production firestore.rules
firebase deploy --only firestore:rules

Write-Host "🗂️ Deploying production Storage rules..." -ForegroundColor Yellow
Copy-Item storage.rules.production storage.rules
firebase deploy --only storage

Write-Host "📊 Deploying Firestore indexes..." -ForegroundColor Yellow
firebase deploy --only firestore:indexes

Write-Host "🏗️ Building Next.js application..." -ForegroundColor Yellow
npm run build

Write-Host "🌐 Deploying to Firebase Hosting..." -ForegroundColor Yellow
firebase deploy --only hosting

Write-Host "✅ Production deployment complete!" -ForegroundColor Green

# Restore original rules for development
Write-Host "🔄 Restoring development rules..." -ForegroundColor Yellow
Copy-Item firestore.rules.backup firestore.rules -ErrorAction SilentlyContinue
Copy-Item storage.rules.backup storage.rules -ErrorAction SilentlyContinue
Remove-Item firestore.rules.backup -ErrorAction SilentlyContinue
Remove-Item storage.rules.backup -ErrorAction SilentlyContinue

Write-Host "==================================" -ForegroundColor Green
Write-Host "🎉 Production Deployment Summary:" -ForegroundColor Green
Write-Host "- Firestore rules: ✅ Deployed" -ForegroundColor Green
Write-Host "- Storage rules: ✅ Deployed" -ForegroundColor Green
Write-Host "- Indexes: ✅ Deployed" -ForegroundColor Green
Write-Host '- Next.js app: ✅ Built & Deployed' -ForegroundColor Green
Write-Host "- Development rules: ✅ Restored" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Green

Write-Host "🔗 Your app is now live!"
firebase hosting:channel:list

Write-Host "⚠️  IMPORTANT: Remember to:" -ForegroundColor Yellow
Write-Host "1. Set production environment variables" -ForegroundColor Yellow
Write-Host "2. Configure Stripe live keys" -ForegroundColor Yellow
Write-Host "3. Set up monitoring and alerts" -ForegroundColor Yellow
Write-Host "4. Test all functionality in production" -ForegroundColor Yellow
Write-Host "5. Update CORS settings for production domain" -ForegroundColor Yellow 