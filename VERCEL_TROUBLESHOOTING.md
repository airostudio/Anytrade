# Vercel Build Troubleshooting

## Error: File Not Found (app/api/tradesperson/profile/route.ts)

If you're seeing an error like:
```
./app/api/tradesperson/profile/route.ts:49:9
Type error: Type '{ userId: string | undefined; ... }' is not assignable...
```

**This file does not exist in the current codebase.** This is a Vercel caching/configuration issue.

### Solution Steps:

#### 1. Verify Vercel is Deploying the Correct Branch
- Go to Vercel Dashboard → Your Project → Settings → Git
- Confirm it says: **Branch: `claude/tradesperson-marketplace-4xppJ`**
- If it shows a different branch, update it

#### 2. Check the Deployed Commit
- Go to Vercel Dashboard → Your Project → Deployments
- Click on the latest deployment
- Look for the Git commit hash
- **Expected commit**: `c25b727` or later
- If it shows an older commit, this is the problem

#### 3. Clear Build Cache and Redeploy
Option A - Via Vercel Dashboard:
1. Go to Settings → General
2. Scroll down to "Build & Development Settings"
3. Look for any caching options
4. Trigger a new deployment with **"Redeploy without cache"**

Option B - Force Fresh Deploy:
1. Go to Deployments tab
2. Find the latest deployment
3. Click the three dots (•••)
4. Select **"Redeploy"**
5. Check **"Use existing Build Cache"** is OFF

#### 4. Verify Git Configuration
Make sure your Vercel project is connected to the correct repository:
```bash
# On your local machine, verify remote:
git remote -v

# Verify current branch:
git branch --show-current
# Should show: claude/tradesperson-marketplace-4xppJ

# Verify you're up to date:
git pull origin claude/tradesperson-marketplace-4xppJ
```

#### 5. Nuclear Option - Delete and Reconnect
If nothing else works:
1. Go to Vercel → Settings → General
2. Scroll to bottom → "Delete Project"
3. Delete the project (this won't delete your code)
4. Go to Vercel Dashboard → "Add New Project"
5. Import your GitHub repository again
6. Select branch: `claude/tradesperson-marketplace-4xppJ`
7. Add all environment variables again
8. Deploy

### Expected File Structure

The current codebase has this structure:
```
app/api/
├── auth/
│   ├── [...nextauth]/route.ts
│   └── signup/route.ts
├── hello/route.ts
└── jobs/
    ├── [id]/route.ts
    ├── applications/route.ts
    └── route.ts
```

**No `tradesperson/profile/` directory exists.**

### Environment Variables Required

Make sure these are set in Vercel:
```bash
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://your-app.vercel.app
PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1
```

### Still Having Issues?

1. **Check Vercel logs**: Look for which commit hash is being built
2. **Verify branch**: Ensure it's `claude/tradesperson-marketplace-4xppJ` not `main` or another branch
3. **Check Git source**: Make sure Vercel is connected to the right GitHub repo
4. **Contact Vercel support**: If the issue persists, this might be a Vercel platform issue

### Successful Build Indicators

When the build succeeds, you should see:
```
✓ Compiled successfully
✓ Generating static pages (5/5)
Route (app)                              Size     First Load JS
┌ ○ /                                    6.02 kB        93.1 kB
├ ○ /_not-found                          873 B            88 kB
└ ○ /api/hello                           0 B                0 B
```

No errors about missing files or TypeScript type issues.
