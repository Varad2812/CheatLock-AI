# 🚀 Push to GitHub Guide

## Step 1: Create a New Repository on GitHub

1. Go to https://github.com
2. Click the **"+"** icon in the top right
3. Click **"New repository"**
4. Fill in:
   - **Repository name**: `CheatLock-AI` (or whatever you prefer)
   - **Description**: "AI-Powered Secure Examination System with Multi-Layer Proctoring"
   - **Visibility**: Choose Public or Private
   - **DO NOT** initialize with README, .gitignore, or license (we already have these)
5. Click **"Create repository"**

## Step 2: Copy the Repository URL

After creating, GitHub will show you a page with commands. Copy the URL that looks like:
```
https://github.com/YOUR_USERNAME/CheatLock-AI.git
```

## Step 3: Run These Commands

Open your terminal in the project folder and run:

```bash
# Add the remote repository (replace with YOUR URL)
git remote add origin https://github.com/YOUR_USERNAME/CheatLock-AI.git

# Verify the remote was added
git remote -v

# Push to GitHub
git push -u origin main
```

## Step 4: Enter Your Credentials

When prompted:
- **Username**: Your GitHub username
- **Password**: Your GitHub Personal Access Token (NOT your password!)

### How to Get a Personal Access Token

If you don't have a token:

1. Go to https://github.com/settings/tokens
2. Click **"Generate new token"** → **"Generate new token (classic)"**
3. Give it a name: "CheatLock AI"
4. Select scopes:
   - ✅ `repo` (Full control of private repositories)
5. Click **"Generate token"**
6. **COPY THE TOKEN** (you won't see it again!)
7. Use this token as your password when pushing

## Alternative: Use SSH

If you prefer SSH:

```bash
# Add SSH remote instead
git remote add origin git@github.com:YOUR_USERNAME/CheatLock-AI.git

# Push
git push -u origin main
```

## Step 5: Verify on GitHub

1. Go to your repository on GitHub
2. Refresh the page
3. You should see all your files! ✅

## What's Been Committed

✅ Complete CheatLock AI codebase
✅ Audio recording feature
✅ Snapshot capture system
✅ Auto-submit fixes
✅ All documentation (40+ files)
✅ Database migrations
✅ Setup scripts

## Commit Message

```
feat: Add audio recording feature with snapshots and auto-submit fixes

- Implemented audio recording for violation evidence
- Added AudioRecorder class for capturing 3-second audio snippets
- Fixed snapshot capture for all violation types
- Fixed auto-submit when violation threshold reached
- Updated reports page to display audio recordings and snapshots
- Added comprehensive documentation and troubleshooting guides
- Database migration for audio recording columns
```

## Files Committed: 85 files, 28,174+ lines

## Next Steps After Pushing

1. ✅ Code is safely backed up on GitHub
2. ✅ Can clone on other machines
3. ✅ Can collaborate with others
4. ✅ Can deploy from GitHub
5. ✅ Version history preserved

## Troubleshooting

### Error: "remote origin already exists"
```bash
git remote remove origin
git remote add origin YOUR_URL
```

### Error: "Authentication failed"
- Make sure you're using a Personal Access Token, not your password
- Generate a new token if needed

### Error: "Permission denied"
- Check you're using the correct GitHub username
- Verify the repository exists
- Check repository visibility settings

## Quick Commands Reference

```bash
# Check status
git status

# View commit history
git log --oneline

# View remote
git remote -v

# Push future changes
git add .
git commit -m "Your commit message"
git push
```

---

**Ready to push? Follow the steps above!** 🚀
