# Source Control & GitHub Integration Guide

## Overview

This guide covers how to effectively use source control with GitHub integration in your IDE (VS Code/Cursor) for the Amplifyd project.

## 🔧 Initial Setup (Already Complete)

✅ **Remote Repository**: Connected to `https://github.com/JalenWynter/amplifydmvp.git`
✅ **Dependencies**: All npm packages installed
✅ **Main Branch**: Set up and tracking origin/main

## 📊 Source Control Panel in IDE

### Accessing Source Control
- **VS Code/Cursor**: Click the Source Control icon in the sidebar (Git branch icon)
- **Keyboard Shortcut**: `Ctrl+Shift+G` (Windows) or `Cmd+Shift+G` (Mac)

### Understanding the Interface
1. **Changes Section**: Shows modified, added, and deleted files
2. **Staged Changes**: Files ready to be committed
3. **Commit Message Box**: Where you write your commit messages
4. **Branch Information**: Current branch and sync status

## 🚀 Daily Workflow

### 1. Before Starting Work
```bash
# Pull latest changes from GitHub
git pull origin main
```

### 2. Making Changes
- Edit files as needed
- Watch the Source Control panel for changes
- Files will appear in the "Changes" section

### 3. Staging Changes
**In IDE:**
- Click the `+` button next to files to stage them
- Or click `+` next to "Changes" to stage all

**Command Line:**
```bash
# Stage specific files
git add filename.tsx

# Stage all changes
git add .
```

### 4. Committing Changes
**In IDE:**
- Write a meaningful commit message
- Click the checkmark (✓) button or press `Ctrl+Enter`

**Command Line:**
```bash
git commit -m "Add user authentication feature"
```

### 5. Pushing to GitHub
**In IDE:**
- Click the sync button (circular arrows)
- Or use the "..." menu → "Push"

**Command Line:**
```bash
git push origin main
```

## 📝 Commit Message Best Practices

### Format
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

### Examples
```
feat(auth): add user authentication system

- Implement Firebase authentication
- Add login/logout functionality
- Create protected routes for dashboard

Closes #123
```

```
fix(payment): resolve Stripe webhook processing

- Fix missing webhook signature validation
- Add proper error handling for failed payments
- Update submission status correctly

Fixes #456
```

## 🌿 Branching Strategy

### Creating Feature Branches
```bash
# Create and switch to new branch
git checkout -b feature/user-profiles

# Or using git switch (newer syntax)
git switch -c feature/user-profiles
```

### Branch Naming Conventions
- `feature/description` - New features
- `fix/description` - Bug fixes
- `hotfix/description` - Urgent fixes
- `docs/description` - Documentation updates

### Merging Branches
```bash
# Switch to main
git checkout main

# Pull latest changes
git pull origin main

# Merge feature branch
git merge feature/user-profiles

# Push merged changes
git push origin main

# Delete feature branch
git branch -d feature/user-profiles
```

## 🔄 Syncing with GitHub

### Pull Before Push
Always pull changes before pushing:
```bash
git pull origin main
```

### Handling Conflicts
If conflicts occur:
1. IDE will highlight conflicted files
2. Edit files to resolve conflicts
3. Stage resolved files
4. Commit the merge

## 📦 Production Deployment Workflow

### 1. Pre-deployment Checklist
```bash
# Check for uncommitted changes
git status

# Run tests
npm test

# Build for production
npm run build

# Check for vulnerabilities
npm audit

# Type checking
npm run typecheck
```

### 2. Create Release Branch
```bash
git checkout -b release/v1.0.0
```

### 3. Update Version
- Update version in `package.json`
- Update `CHANGELOG.md` with new features

### 4. Deploy
```bash
# Commit version changes
git add .
git commit -m "chore: bump version to v1.0.0"

# Merge to main
git checkout main
git merge release/v1.0.0

# Tag the release
git tag v1.0.0

# Push everything
git push origin main --tags
```

## 🏷️ Tags and Releases

### Creating Tags
```bash
# Create annotated tag
git tag -a v1.0.0 -m "Release version 1.0.0"

# Push tags
git push origin --tags
```

### GitHub Releases
1. Go to your GitHub repository
2. Click "Releases" → "Create a new release"
3. Select your tag
4. Write release notes
5. Publish release

## 🚨 Emergency Procedures

### Reverting Changes
```bash
# Revert last commit
git revert HEAD

# Revert specific commit
git revert <commit-hash>
```

### Reset to Previous State
```bash
# Reset to last commit (loses local changes)
git reset --hard HEAD

# Reset to specific commit
git reset --hard <commit-hash>
```

## 🔧 IDE Extensions (Recommended)

### VS Code Extensions
1. **GitLens** - Enhanced Git capabilities
2. **Git History** - View git log and file history
3. **GitHub Pull Requests** - Manage PRs from IDE
4. **GitGraph** - Visual git graph

### Cursor Extensions
Similar extensions are available for Cursor IDE.

## 📊 Monitoring Your Repository

### GitHub Repository Health
- **Insights Tab**: View contribution activity
- **Security Tab**: Check for vulnerabilities
- **Actions Tab**: Monitor automated workflows

### Local Repository Status
```bash
# Check repository status
git status

# View commit history
git log --oneline -10

# Check remote status
git remote -v
```

## 🎯 Next Steps

1. **Set up branch protection** on GitHub main branch
2. **Create pull request templates**
3. **Set up automated testing** with GitHub Actions
4. **Configure deployment workflows**

## 🆘 Common Issues & Solutions

### Issue: "Permission denied" when pushing
**Solution**: Set up SSH keys or use personal access tokens

### Issue: Merge conflicts
**Solution**: Use IDE's merge conflict resolver or manually edit files

### Issue: Large files causing push issues
**Solution**: Check `.gitignore` and use Git LFS for large files

### Issue: Accidentally committed sensitive data
**Solution**: Use `git filter-branch` or GitHub's remove sensitive data guide

---

**Remember**: Commit early, commit often, and always write meaningful commit messages! 