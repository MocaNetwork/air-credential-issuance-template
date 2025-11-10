# Netlify Deployment Setup Guide

## Required Environment Variables

To deploy this AIR Credential Issuance application on Netlify, you need to configure the following environment variables in your Netlify dashboard.

### Step 1: Access Netlify Environment Variables

1. Go to your Netlify site dashboard
2. Navigate to **Site configuration** → **Environment variables**
3. Click **Add a variable** or **Add environment variables**

### Step 2: Add Required Variables

Copy and paste these environment variables into Netlify:

#### ✅ Partner Configuration (CONFIGURED)

```bash
NEXT_PUBLIC_PARTNER_ID=3e8c5fd5-6679-48c6-9873-60b055e6914f
NEXT_PUBLIC_ISSUER_DID=did:air:id:test:4NyWcVNPe1KuCog1iNFPoMKV6S8GJcDTVVWi8sQy6t
NEXT_PUBLIC_ISSUE_PROGRAM_ID=c21uu0g14vlb90037676xk
```

#### ⚠️ Security Configuration (YOU MUST PROVIDE)

```bash
PARTNER_PRIVATE_KEY=[YOUR_PRIVATE_KEY_HERE]
SIGNING_ALGORITHM=ES256
```

**Important**: You must provide your `PARTNER_PRIVATE_KEY`. If you don't have one, generate it using:

```bash
openssl ecparam -name prime256v1 -genkey -noout | openssl pkcs8 -topk8 -nocrypt
```

#### 🔧 Standard Configuration

```bash
NEXT_PUBLIC_BUILD_ENV=sandbox
NEXT_PUBLIC_MOCA_CHAIN=devnet
NEXT_PUBLIC_HEADLINE=Store your Reputation Securely on Moca Network
NEXT_PUBLIC_APP_NAME=AIR Issuance
NEXT_PUBLIC_THEME=system
NEXT_PUBLIC_AUTH_METHOD=wallet
```

#### 🔗 Reown Configuration (OPTIONAL - REQUIRED FOR WALLET CONNECTION)

```bash
NEXT_PUBLIC_REOWN_PROJECT_ID=[YOUR_REOWN_PROJECT_ID]
```

Get your Reown Project ID from: https://cloud.reown.com/

### Step 3: Deploy

After adding all environment variables:

1. Click **Save**
2. Trigger a new deployment:
   - Push changes to your Git repository, or
   - Click **Trigger deploy** → **Deploy site** in Netlify

### Step 4: Post-Deployment Configuration

After your site is deployed, you need to:

#### 1. Configure JWKS URL in AIR Partner Dashboard

Your JWKS URL will be: `https://your-netlify-site.netlify.app/jwks.json`

- Navigate to your [AIR Partner Dashboard](https://partner.air3.com)
- Go to Account → Settings
- Add your JWKS URL

#### 2. Whitelist Your Domain

- Navigate to Account → Domains in the Partner Dashboard
- Add your Netlify domain: `your-netlify-site.netlify.app`

## Reference Information

### Your Partner Credentials

- **Partner ID**: `3e8c5fd5-6679-48c6-9873-60b055e6914f`
- **Issuer DID**: `did:air:id:test:4NyWcVNPe1KuCog1iNFPoMKV6S8GJcDTVVWi8sQy6t`
- **Program ID**: `c21uu0g14vlb90037676xk`
- **Verifier DID**: `did:key:Xwp8zrHinAHFhkQmJN9n6HLW3zM1CmBsApaF3mHUgY9eHV5eb62FtTbTj4iYm4sVU5dUXPtNKjxDYpynqsDPEYrmD3y`

### Environment

- **Build Environment**: Sandbox (Test)
- **Chain**: Devnet

## Troubleshooting

### Build Fails with Missing Environment Variables

Make sure all required environment variables are set in Netlify, especially:
- `PARTNER_PRIVATE_KEY`
- `NEXT_PUBLIC_PARTNER_ID`
- `NEXT_PUBLIC_ISSUER_DID`
- `NEXT_PUBLIC_ISSUE_PROGRAM_ID`

### ESLint Errors During Build

The build will fail if there are any ESLint errors. Make sure your code passes linting:

```bash
npm run lint
```

### Credential Issuance Fails

After deployment:
1. Verify your JWKS URL is configured in the AIR Partner Dashboard
2. Ensure your domain is whitelisted
3. Check that all environment variables match your partner credentials

## Support

- [AIR Protocol Documentation](https://docs.air3.com)
- [AIR Partner Dashboard](https://partner.air3.com)
- [Netlify Documentation](https://docs.netlify.com)

---

**Last Updated**: November 10, 2025
**Status**: Ready for Deployment
