# Inventory Backend - Render Deployment

## Environment Variables (Render Dashboard)

| Key | Value Format | Example |
|-----|--------------|---------|
| `FIREBASE_PROJECT_ID` | Your project ID | `inventorymanagement-8be56` |
| `FIREBASE_CLIENT_EMAIL` | Service account email | `firebase-adminsdk-xxxx@inventorymanagement-8be56.iam.gserviceaccount.com` |
| `FIREBASE_PRIVATE_KEY` | **Multi-line PEM with `\\n`** | `-----BEGIN PRIVATE KEY-----\\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...` |

### Private Key Format (CRITICAL)
1. Firebase Console → Project Settings → Service Accounts → Generate new private key → Download JSON
2. Copy `private_key` field 
3. **Replace every line break with `\\n`** (double backslash n)
4. Paste as single line in Render Environment Variables

**Example:**
```
-----BEGIN PRIVATE KEY-----\\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7...\\n-----END PRIVATE KEY-----\\n
```

## Render Service Settings
- **Root Directory**: `server/`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Plan**: Free

## Test
```
curl https://your-app.onrender.com/health
curl https://your-app.onrender.com/api-docs
```

## API Docs
Live at `https://your-app.onrender.com/api-docs`

