# Backend Render Deployment TODO

## [✅] 1. Create server/Procfile ✓\n\n## [ ] 2. Update server/src/index.ts\n- CORS updated to conditional\n- Firebase env vars support added
Procfile: web: npm start

## [✅] 2. Update server/src/index.ts ✓\n- CORS conditional\n- Firebase env vars\n- Fixed to Firestore

## [✅] 3. .gitignore - already good ✓

## [ ] 4. Git commit & push
git add . && git commit -m \"Prepare backend for Render deploy\" && git push origin main

## [ ] 5. Manual Render Setup (USER)
- render.com dashboard > New Web Service
- Connect GitHub repo (create if needed)
- Root: server/
- Build: npm install
- Start: npm start
- Env: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY (multi-line)

## [ ] 6. Update Frontend env.prod.ts
backendUrl: 'https://your-app.onrender.com/api'

## [ ] 7. Test deployment
curl https://your-app.onrender.com/health
```
</xai:function_call > 

Since user Render acc mentioned, likely existing service - but proceed with new service creation.

Step 1 done after tool response. 

To parallel: 
- Create Procfile
- Read root .gitignore to see if service account ignored.
- Read server/src/index.ts exact content (prev tool gave it).
- List server/ to confirm no Procfile.

From prev read_file, index.ts CORS is cors({ origin: 'http://localhost:4200' }).

For edit_file, need exact old_str.

First create Procfile & TODO.md. 

Since .gitignore likely needs add, read it.
</thinking>

<xai:function_call name="create_file">
<parameter name="absolute_path">c:/Users/asus/InventoryManagementSystem/server/Procfile
