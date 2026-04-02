# Supabase Migration Setup - Complete Guide

## ✅ What's Been Completed

### 1. **Supabase Configuration**
- ✅ Project linked: `xunlyrcbjwvxulpqudqw`
- ✅ Credentials stored in `.env.local`
- ✅ Supabase client initialized in `src/lib/supabase.ts`

### 2. **Database Setup**
- ✅ **Transactions table** created with:
  - UUID user_id (references auth.users)
  - Currency tracking
  - Buy/Sell actions
  - Amount, price, total_value
  - Timestamps
  - Row-level security policies

- ✅ **Holdings table** created with:
  - UUID user_id (references auth.users)
  - Currency holdings
  - Quantity and average price
  - Unique constraint per user+currency
  - Update timestamp tracking
  - Custom triggers
  - Row-level security policies

### 3. **Database Access Code**
- ✅ Database utilities: `src/utils/database.ts`
  - `saveTransaction()` - Insert new trades
  - `getTransactions()` - Fetch user's trades
  - `getHoldings()` - Fetch user's holdings
  - `saveHoldings()` - Update/save holdings

- ✅ Trading hook: `src/hooks/useTrading.ts`
  - Async state management
  - Error handling
  - Loading states

### 4. **Authentication Setup**
- ✅ Auth context: `src/contexts/AuthContext.tsx`
  - Sign up
  - Sign in
  - Sign out
  - Session management

- ✅ Login page: `src/pages/LoginPage.tsx`
  - Email/password authentication
  - Sign up and sign in forms

- ✅ Protected routes: `src/App.tsx`
  - Automatic redirect to login
  - Session persistence

### 5. **Utilities**
- ✅ Connection test: `src/utils/testConnection.ts`
- ✅ Migration utilities for localStorage → Supabase

---

## 🚀 What You Need to Do Now

### Step 1: Start Your Development Server
```bash
npm run dev
```

### Step 2: Go to Login Page
- Open http://localhost:5173
- You'll be redirected to /login automatically

### Step 3: Create an Account
- Click "Don't have an account? Sign Up"
- Enter an email and password
- Click "Sign Up"
- Verify your email (check spam folder if needed)

### Step 4: Sign In
- Use your credentials to sign in
- You'll be redirected to the main app

### Step 5: Test the Connection
```javascript
// In browser console, run:
import { testSupabaseConnection } from '@/utils/testConnection'
testSupabaseConnection()
```

---

## 📊 Database Schema

### transactions table
```
id              BIGSERIAL PRIMARY KEY
user_id         UUID (references auth.users)
currency        VARCHAR(10)
action          VARCHAR(10) - 'buy' or 'sell'
amount          DECIMAL(20,8)
price           DECIMAL(20,8)
total_value     DECIMAL(20,8)
created_at      TIMESTAMP WITH TIME ZONE
```

### holdings table
```
id              BIGSERIAL PRIMARY KEY
user_id         UUID (references auth.users)
currency        VARCHAR(10)
quantity        DECIMAL(20,8)
avg_price       DECIMAL(20,8)
created_at      TIMESTAMP WITH TIME ZONE
updated_at      TIMESTAMP WITH TIME ZONE
UNIQUE(user_id, currency)
```

---

## 🔒 Security Features

✅ Row-Level Security (RLS) enabled on both tables
- Users can only see/edit their own data
- Policies enforce user_id = auth.uid()
- SELECT, INSERT, UPDATE, DELETE all require authentication

✅ Constraints:
- Foreign key relationships to auth.users
- Automatic cascade delete on user removal
- Check constraints for valid values

---

## 🔄 Data Migration from localStorage

If you have existing localStorage data:

```javascript
// In browser console:
const oldData = localStorage.getItem('holdings');
const holdings = JSON.parse(oldData);

// The database will auto-sync when you make trades
// Existing holdings can be manually imported via the Migration Panel
```

---

## 🐛 Troubleshooting

### Issue: "User not authenticated"
- ✅ Go to /login and sign in
- ✅ Check if email is verified

### Issue: "relation does not exist"
- ✅ The migration already ran successfully
- ✅ Tables exist in the remote database

### Issue: Can't see my data
- ✅ Make sure you're viewing data for the correct user
- ✅ RLS policies enforce user-specific access

### Issue: Environment variables not loading
- ✅ Restart dev server after changing .env.local
- ✅ Check that VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set

---

## 📋 Environment Variables (.env.local)

```
VITE_SUPABASE_URL=https://xunlyrcbjwvxulpqudqw.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_yEK7T93nTDj0rsQ6C4UCDg_6ccTy7VJ
```

⚠️ **Never commit .env.local to git**

---

## ✨ Next Steps for Production

1. **Add email verification** - Set up SMTP provider in Supabase
2. **Enable MFA** - Multi-factor authentication for security
3. **Set up OAuth** - Allow sign in with Google, GitHub, etc.
4. **Configure CORS** - Set proper domain restrictions
5. **Enable backups** - Set up automated database backups
6. **Monitor usage** - Set up alerts for API rate limits

---

## 📚 Useful Resources

- [Supabase Docs](https://supabase.com/docs)
- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase CLI](https://supabase.com/docs/guides/cli)

---

## 🎉 You're All Set!

Your paper trading app is now fully connected to Supabase. Track your trades, manage holdings, and scale your trading strategies with a production-ready backend!
