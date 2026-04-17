# Zapier + Zeffy → Google Sheets Setup

## Step 1: Accept Zeffy's Zapier Invite

- Go to [Zeffy's Zapier invite link](https://zapier.com/app/login?next=/developer/public-invite/8680/e770c9cbc05e75185de958d7cf50653c/)
- Log in or create a Zapier account
- Scroll down and click **"Accept Invite & Build a Zap"**

## Step 2: Create a New Zap

- Click **"+ Create Zap"**
- For the **Trigger**, search for **Zeffy** (select the latest version)

## Step 3: Choose the Trigger Event

- **Get Donations** — triggers for each donation (amount, donor info, etc.)
- **Get Order** — triggers for each ticket/membership/raffle purchase
- Pick whichever applies (you can create separate Zaps for each)

## Step 4: Connect Your Zeffy Account

- Click **Continue** → you'll be prompted to sign in with your Zeffy credentials
- Authorize the connection

## Step 5: Test the Trigger

- Zapier will pull a sample transaction from Zeffy
- Verify the data looks correct (name, email, amount, campaign name, etc.)

## Step 6: Set Up the Action (Google Sheets)

- Click **"Action"** → search for **Google Sheets**
- Choose **"Create Spreadsheet Row"**
- Connect your Google account
- Select or create a spreadsheet (e.g., "Dishari Zeffy Dashboard")
- Map the Zeffy fields to your sheet columns:
  - Column A: Date
  - Column B: Name
  - Column C: Email
  - Column D: Campaign/Event Name
  - Column E: Amount
  - Column F: Payment Method
  - (customize as needed)

## Step 7: Test & Turn On

- Test the action to confirm a row gets added to your sheet
- Click **"Publish"** to activate the Zap

## Step 8: Repeat for Other Triggers (Optional)

- Create a second Zap with **Get Order** if you set up the first one with **Get Donations** (or vice versa)
- Point both to the same or separate sheets

## Notes

- Zeffy does **not** have a public API — Zapier is the only integration path
- Free Zapier tier: **100 tasks/month** (sufficient for most months)
- If you exceed 100 tasks, Zaps pause until the next month (no surprise charges)
- Nonprofits get ~15% off paid Zapier plans: [zapier.com/non-profits](https://zapier.com/non-profits)
