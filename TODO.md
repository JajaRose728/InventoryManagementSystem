# Inventory Management System Fix GitHub Push Block

## Steps to Complete:

### 1. [ ] Install git-filter-repo (one-time setup)
   - Check: `git filter-repo --version`
   - If missing: `pip install git-filter-repo`

### 2. [ ] Remove secret file from entire Git history
   - Run: `git filter-repo --path src/environments/firebase-adminsdk.json --invert-paths`

### 3. [ ] Delete local secret file
   - Run: `del "src\\environments\\firebase-adminsdk.json"`

### 4. [ ] Commit .gitignore updates (if any) and force-push
   - Run: `git add .gitignore && git commit -m "Remove leaked Firebase secret and update gitignore" && git push --force-with-lease origin main`

### 5. [ ] Verify push succeeds
   - Run: `git push origin main`

### 6. [ ] Secure follow-up
   - Regenerate Firebase service account key in Google Console (old key compromised).
   - Refactor server to use environment variables instead of JSON file.

**Track progress by marking [x] as completed!**
