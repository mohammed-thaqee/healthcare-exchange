# Healthcare Data Exchange — Setup & Demo

## What this is
Consent-driven medical data sharing between hospitals.
- Blockchain (Ethereum Sepolia) stores **only audit logs** — no medical data on-chain
- Patient consent is mandatory via **email OTP**
- Data is **AES-256 + RSA encrypted** end-to-end
- Full audit trail is **tamper-proof and verifiable** on Etherscan

---

## Prerequisites
- Node.js v18+  →  https://nodejs.org
- OpenSSL  →  pre-installed on Mac/Linux; on Windows use Git Bash or WSL
- MetaMask browser extension  →  https://metamask.io
- Free accounts at: MongoDB Atlas, Alchemy, Gmail

---

## One-time setup (do this before the demo)

### 1. Install dependencies

```bash
# Backend
npm install

# Frontend
cd frontend
npm install
cd ..
```

### 2. Configure environment

```bash
# Mac/Linux
cp .env.example .env

# Windows
copy .env.example .env
```

Open `.env` and fill in every value:

| Variable | Where to get it |
|---|---|
| `MONGO_URI` | MongoDB Atlas → Connect → Drivers → copy connection string |
| `JWT_SECRET` | Any random 32+ character string |
| `PATIENT_ID_SALT` | Any other random string |
| `SEPOLIA_RPC_URL` | Alchemy → New App → Ethereum/Sepolia → View Key → HTTPS URL |
| `PRIVATE_KEY` | MetaMask → Account → ⋮ → Account Details → Export Private Key |
| `BACKEND_WALLET_ADDRESS` | MetaMask → copy your wallet address (0x...) |
| `CONTRACT_ADDRESS` | Fill AFTER step 4 below |
| `GMAIL_USER` | Your Gmail address |
| `GMAIL_APP_PASSWORD` | Google Account → Security → App Passwords → create one |

Get free Sepolia ETH (you need ~0.1 ETH for gas):
→ https://sepoliafaucet.com  (paste your MetaMask address)

### 3. Generate RSA keys (for data encryption)

```bash
# Mac/Linux
mkdir keys
openssl genrsa -out keys/hospital-a-private.pem 2048
openssl rsa -in keys/hospital-a-private.pem -pubout -out keys/hospital-a-public.pem

# Windows (Git Bash or WSL)
mkdir keys
openssl genrsa -out keys/hospital-a-private.pem 2048
openssl rsa -in keys/hospital-a-private.pem -pubout -out keys/hospital-a-public.pem
```

### 4. Compile and deploy the smart contract

```bash
npx hardhat compile
npx hardhat run scripts/deploy.js --network sepolia
```

Copy the printed `CONTRACT_ADDRESS=0x...` line into your `.env` file.

### 5. Seed the database

Open `scripts/seed.js` and change `DEMO_EMAIL` to your own email address (you will receive OTP emails here).

```bash
node scripts/seed.js
```

---

## Running the demo

### Terminal 1 — backend
```bash
node src/server.js
```
Expected output:
```
✅ MongoDB connected
🚀 Server → http://localhost:3000
```

### Terminal 2 — frontend
```bash
cd frontend
npm run dev
```
Open http://localhost:5173 in your browser.

---

## Demo flow (do in order)

1. **Login** — click "Login as Hospital A"
2. **Request data** — select PAT-001, Hospital B, LABS → Submit Request
3. **Send OTP** — click "Send OTP Email" → check your email inbox
4. **Grant consent** — enter the 6-digit OTP → click Grant
5. **Transfer data** — paste contents of `keys/hospital-a-public.pem` → Transfer
6. **Audit trail** — click "View Audit Trail" → open any TX hash on Etherscan

---

## Troubleshooting

| Error | Fix |
|---|---|
| `Hardhat only supports ESM` | Open package.json, delete the `"type": "module"` line if present |
| `Not authorized hospital` on chain | Deployer is auto-authorized. If using a different wallet, re-deploy or call authorizeHospital manually |
| OTP email not arriving | Check spam. Make sure GMAIL_APP_PASSWORD is the 16-char App Password, not your Gmail login password |
| `ABI not found` | Run `npx hardhat compile` first |
| `Patient not found` | Re-run `node scripts/seed.js`, confirm DEMO_EMAIL is set |
| Sepolia TX pending forever | Network congestion — wait 2 min. Or open Etherscan and check for pending state |
| `Cannot connect to MongoDB` | Check Atlas IP whitelist allows 0.0.0.0/0, and your MONGO_URI password has no special chars |
