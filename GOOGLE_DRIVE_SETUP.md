# Google Drive Sync Guide

This is the complete guide for syncing website content (images, videos, testimonials) from Google Drive using a **Service Account**.

## Overview

Once set up, you'll be able to:
- Store section images in Google Drive folders
- Run a single command to sync all content to your website
- Add/remove images from Drive, then re-sync with one command
- Keep sections hidden automatically when folders are empty
- Authentication is **not tied to any individual user** — the service account is a shared machine identity

---

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click the project dropdown at the top
3. Click **"New Project"**
4. Enter project name: `Dishari Website` (or any name)
5. Click **"Create"**
6. Wait for the project to be created, then select it

## Step 2: Enable Google Drive API

1. In the Google Cloud Console, search for **"Google Drive API"**
2. Click on "Google Drive API"
3. Click the **"Enable"** button
4. Wait for it to finish enabling

## Step 3: Create a Service Account

1. Go to **APIs & Services → Credentials**
   - Click the menu icon (☰) → API & Services → Credentials

2. Click **"+ Create Credentials"** → **"Service account"**

3. Fill in the details:
   - **Service account name**: `dishari-drive-sync` (or any name)
   - **Service account ID**: auto-generated (e.g., `dishari-drive-sync@project.iam.gserviceaccount.com`)
   - Click **"Create and Continue"**

4. Skip the optional "Grant this service account access" and "Grant users access" steps
   - Click **"Done"**

5. **Download the key file:**
   - In the Service Accounts list, click the account you just created
   - Go to the **"Keys"** tab
   - Click **"Add Key"** → **"Create new key"**
   - Select **JSON** format
   - Click **"Create"**
   - Save the downloaded file as **`credentials.json`** in the project root

> **Important**: The `credentials.json` file contains a private key. Never commit it to git (it's already in `.gitignore`).

### ⚠️ Google Workspace: Organization Policy Constraints

If your Google Workspace org restricts service account key creation, you may see an error when trying to create a key. An administrator with the **Organization Policy Administrator** (`roles/orgpolicy.policyAdmin`) role needs to disable these constraints:

| Constraint                                          | What it blocks                        |
| --------------------------------------------------- | ------------------------------------- |
| `iam.disableServiceAccountKeyCreation`               | Creating new SA keys                  |
| `iam.disableServiceAccountKeyUpload`                 | Uploading external SA keys            |

**To disable (temporarily or permanently):**

1. Go to [Google Cloud Console → IAM & Admin → Organization Policies](https://console.cloud.google.com/iam-admin/orgpolicies)
2. Search for the constraint name (e.g., `iam.disableServiceAccountKeyCreation`)
3. Click the constraint → **"Manage Policy"**
4. Set to **"Not enforced"** (or add an exception for your project)
5. Save, then retry key creation

> **Tip**: If your org admin prefers not to allow SA keys at all, you can use **Workload Identity Federation** instead — see the [Alternatives to SA Keys](#alternatives-to-service-account-keys) section below.

## Step 4: Share Drive Folders with the Service Account

The service account needs **Viewer** access to each Google Drive folder it will sync from.

1. Find the service account email in `credentials.json` — look for the `client_email` field
   (e.g., `dishari-drive-sync@project.iam.gserviceaccount.com`)

2. For **each** Drive folder listed below:
   - Open the folder in Google Drive
   - Click **"Share"**
   - Paste the service account email
   - Set permission to **"Viewer"**
   - Uncheck "Notify people" (service accounts can't receive email)
   - Click **"Share"**

**Tip (Google Workspace):** If you're on Google Workspace, you can add the service account email to a **Google Group**, then share the Drive folders with that group. This way you only manage access in one place.

## Step 5: Install Dependencies

```powershell
cd C:\Users\pghos6\Downloads\DishariWebsite
npm run sync:install
```

This installs the `googleapis` npm package needed by the sync script.

## Step 6: Verify Folder IDs

The folder ID is in the URL when you open a folder in Google Drive:

```
https://drive.google.com/drive/folders/FOLDER_ID_HERE
```

The current folder IDs are pre-configured in `scripts/drive-config.json`:

| Section           | Folder ID                              |
| ----------------- | -------------------------------------- |
| Carousel          | `1dcXSMMWbvlFgVmMAYw2xgj6NMsdGrt6O`   |
| Upcoming Event    | `1FGE7oeIqJZrEQZLOM39VQkYOvjYq7HoP`   |
| Testimonials      | `17Q0oycfkCQXWrZvpDEQFUU7rF-iEl6ds`   |
| Event 1           | `1CaocYN_vG67QwBvkEaKmfG1miARek8vk`   |
| Event 2           | `1uOzeRLuENGAolBpeKc0GVEcXMrEXLGUi`   |
| Event 3           | `1svSU77SBDmxWw3lbAMBo62kAgjVRZJgR`   |

To update folder IDs, edit `scripts/drive-config.json`.

## Step 7: Upload Images to Google Drive

1. Open the appropriate Google Drive folder
2. Upload your images (JPG, PNG, GIF, WebP)
3. **Important**: The script only syncs files in the main folder, not subfolders

## Step 8: Run the Sync Script

```powershell
cd C:\Users\pghos6\Downloads\DishariWebsite
npm run sync
```

No browser prompt or login required — the service account authenticates silently using the private key in `credentials.json`.

### Sync specific sections

```powershell
npm run sync -- --only carousel
npm run sync -- --only upcoming
npm run sync -- --only events
npm run sync -- --only testimonials
```

## Using the Script Going Forward

Every time you add or remove content from your Google Drive folders:

```powershell
npm run sync
```

No re-authentication needed — the service account key doesn't expire.

---

## What the Script Does

When you run `npm run sync`, the script:

1. Authenticates with Google Drive using the service account key
2. For each configured folder:
   - Lists all image/video files
   - Generates direct-view URLs
   - Updates the corresponding JSON file in `public/data/`
3. For testimonials:
   - Reads Google Docs from the testimonials folder
   - Exports each doc's text content
   - Uses the doc filename as the person's name

### Output Files

| Script section    | Output file                          |
| ----------------- | ------------------------------------ |
| Carousel          | `public/data/carousel-images.json`   |
| Upcoming Event    | `public/data/upcoming-event.json`    |
| Past Events       | `public/data/past-events.json`       |
| Testimonials      | `public/data/testimonials.json`      |

---

## Troubleshooting

### "credentials.json not found"
- Download the service account key from Google Cloud Console (Step 3)
- Save it as exactly `credentials.json` (lowercase) in the project root

### "credentials.json is not a service account key"
- The script expects a JSON file with `"type": "service_account"`
- If you have an old OAuth `credentials.json` (with `"installed"` key), replace it with a service account key

### "No images found in folder"
- Make sure images are in the root of the folder (not in subfolders)
- Check that files have extensions: .jpg, .jpeg, .png, .gif, .webp
- Verify the folder ID is correct in `scripts/drive-config.json`

### "Access denied" or "Permission error"
- Make sure the Drive folder is **shared** with the service account email (`client_email` in `credentials.json`)
- The service account needs at least **Viewer** permission
- If using a Google Group, verify the service account is a member of the group

### "API not enabled"
- Go to Google Cloud Console → APIs & Services → Enable the **Google Drive API**

### Images don't appear on website
- Check browser console (F12) for errors
- Make sure you're running `npm run dev` for local development
- Refresh the page
- Run `npm run sync` again

---

## Security Notes

- `credentials.json` is **local-only** and listed in `.gitignore`
- It is **never** committed to the repository or uploaded to the website
- The service account key grants **read-only** access to Google Drive (scoped to `drive.readonly`)
- The key does not expire, but can be revoked from Google Cloud Console at any time
- If the key is compromised, delete it in Cloud Console → Service Accounts → Keys, and create a new one

### Best practices for service account keys

- **Rotate keys periodically** — delete old keys and create new ones in Cloud Console
- **Limit key distribution** — only share with team members who need to run the sync script
- **Monitor usage** — check Cloud Console → IAM & Admin → Audit Logs for unexpected activity
- **Use short-lived credentials when possible** — see alternatives below

### Alternatives to Service Account Keys

Google recommends avoiding long-lived SA keys when possible. Depending on your setup:

| Alternative                         | Best for                                          | Requires SA key? |
| ----------------------------------- | ------------------------------------------------- | ----------------- |
| **Service Account Key** (current)   | Local dev machines, simple setups                  | Yes               |
| **Workload Identity Federation**    | CI/CD (GitHub Actions, etc.)                       | No                |
| **Domain-Wide Delegation**          | Workspace admins impersonating users               | Yes (one-time)    |
| **gcloud impersonation**            | Devs with `gcloud` CLI who can impersonate the SA  | No                |

**Using `gcloud` impersonation** (no key file needed):

If the Workspace admin prefers not to create downloadable keys, developers with the **Service Account Token Creator** role can impersonate the SA without a key:

```bash
# One-time: authenticate with your own account
gcloud auth application-default login --impersonate-service-account=dishari-drive-sync@PROJECT.iam.gserviceaccount.com

# Then run the sync script as usual — it picks up ADC automatically
npm run sync
```

This requires the `gcloud` CLI and the user must have `roles/iam.serviceAccountTokenCreator` on the service account.

---

## Migrating from the Old WordPress Project

The old project used a Python script (`sync_google_drive.py`) with **OAuth 2.0** credentials tied to a personal Google account.

This project uses a **Service Account** instead — the auth is not tied to any individual.

| Aspect                | Old (Python + OAuth)                  | New (Node.js + Service Account)       |
| --------------------- | ------------------------------------- | ------------------------------------- |
| Command               | `python sync_google_drive.py`         | `npm run sync`                        |
| Auth type             | OAuth 2.0 (personal account)          | Service Account (machine identity)    |
| Browser prompt        | Yes (first run)                       | Never                                 |
| Credentials file      | OAuth client secret                   | Service account key                   |
| Folder access         | Automatic (your account)              | Must share folders with SA email      |
| Token file            | `token.pickle`                        | Not needed                            |
| Config                | Interactive folder ID prompts         | Pre-configured in `drive-config.json` |
| Dependencies          | `pip install google-*`                | `npm run sync:install`                |
| Output                | `wwwroot/*.json`                      | `public/data/*.json`                  |

### Migration steps

1. **Create a new service account** key (Step 3 above) — the old OAuth `credentials.json` will **not** work
2. **Share all Drive folders** with the service account email (Step 4)
3. **Delete** the old `credentials.json`, `token.pickle`, and `token.json` if present
4. **Place** the new service account `credentials.json` in the project root
5. Run `npm run sync` — no Python required
