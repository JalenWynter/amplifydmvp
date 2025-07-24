# Firebase Production Seeding Instructions

## Setup Service Account Key

1. **Download Service Account Key:**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project: `amplifydmvp`
   - Go to Project Settings > Service Accounts
   - Click "Generate New Private Key"
   - Download the JSON file

2. **Place Service Account Key:**
   - Rename the downloaded file to `serviceAccountKey.json`
   - Place it in the `scripts/` directory
   - **IMPORTANT:** Never commit this file to git (it's already in .gitignore)

## Run Seed Scripts

After placing the service account key, run:

```bash
# Seed Auth and Firestore users
node scripts/seedAuthUsers.js

# Seed additional Firestore collections
node scripts/seedFirestore.js
```

## Seeded Users

The scripts will create/update these users with consistent role casing:

| Email | Role | Dashboard Access |
|-------|------|------------------|
| jwynterthomas@gmail.com | admin | `/admin` |
| brenda.lee@amplifyd.com | reviewer | `/dashboard` |
| alex.chen@amplifyd.com | reviewer | `/dashboard` |
| cosmic@dreamer.com | artist | `/artist-dashboard` |

## Role Casing

All roles are now consistently lowercase:
- `admin` (not `Admin`)
- `reviewer` (not `Reviewer`) 
- `artist` (not `Artist`)

## Security Notes

- The service account key has full admin access to your Firebase project
- Keep it secure and never share or commit it
- Consider using environment variables for production deployments 