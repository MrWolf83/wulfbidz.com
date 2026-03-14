# WulfBidz Security Configuration

## Database Security Status

### Row Level Security (RLS)
All RLS policies have been optimized for performance using `(SELECT auth.uid())` pattern to prevent re-evaluation on each row.

**Tables with RLS enabled:**
- ✅ profiles
- ✅ listings
- ✅ bids
- ✅ photos
- ✅ search_alerts

### Database Indexes

The following indexes are currently marked as "unused" but are intentionally configured for production use:

| Index Name | Table | Purpose | Status |
|------------|-------|---------|--------|
| `idx_listings_seller` | listings | Query listings by seller | Ready for production |
| `idx_listings_auction_end` | listings | Sort/filter by auction end time | Ready for production |
| `idx_bids_listing` | bids | Query bids for a listing | Ready for production |
| `idx_bids_bidder` | bids | Query bids by bidder | Ready for production |
| `idx_photos_listing` | photos | Query photos for a listing | Ready for production |
| `idx_search_alerts_user` | search_alerts | Query alerts by user | Ready for production |

**Note:** These indexes will be automatically utilized once the application has production traffic. They are essential for query performance at scale.

## Auth Configuration Requirements

The following security enhancements require configuration in the Supabase Dashboard and cannot be set via SQL migrations:

### 1. Auth Database Connection Strategy

**Current Issue:** Auth server is configured with a fixed connection limit (10 connections).

**Required Action:**
1. Navigate to Supabase Dashboard → Project Settings → Database
2. Find the "Auth Connection Pooling" section
3. Switch from "Fixed Number" to "Percentage-based" allocation
4. Set an appropriate percentage (recommended: 10-20% of total connections)

**Why:** Percentage-based allocation allows the Auth server to scale automatically when you increase your database instance size.

### 2. Leaked Password Protection

**Current Issue:** Protection against compromised passwords is disabled.

**Required Action:**
1. Navigate to Supabase Dashboard → Authentication → Settings
2. Find "Password Protection" settings
3. Enable "Check for compromised passwords"
4. This will validate passwords against the HaveIBeenPwned database

**Why:** This prevents users from using passwords that have been exposed in data breaches, significantly improving account security.

## Security Best Practices Implemented

### Database Level
- ✅ Row Level Security enabled on all tables
- ✅ Optimized RLS policies for performance
- ✅ Foreign key constraints for data integrity
- ✅ Indexes for query performance
- ✅ Default values to prevent null-related issues

### Authentication
- ✅ Email/password authentication with Supabase Auth
- ✅ Secure session management
- ✅ Protected API routes
- ✅ User data isolation via RLS

### Application Level
- ✅ No secrets or API keys in client-side code
- ✅ Environment variables for sensitive configuration
- ✅ Secure file uploads with validation
- ✅ Input sanitization on user data

## Deployment Checklist

Before going to production, ensure:

- [ ] Enable leaked password protection in Supabase Dashboard
- [ ] Switch Auth to percentage-based connection strategy
- [ ] Review and test all RLS policies
- [ ] Verify all environment variables are set
- [ ] Test authentication flows
- [ ] Validate file upload security
- [ ] Enable HTTPS only in production
- [ ] Set up proper CORS policies
- [ ] Configure rate limiting for API endpoints
- [ ] Enable Supabase database backups
- [ ] Set up monitoring and alerts

## Monitoring

Recommended metrics to monitor:
- Failed authentication attempts
- Database query performance
- Index usage statistics
- Connection pool utilization
- API error rates

## Support

For security issues or questions:
- Review Supabase security documentation: https://supabase.com/docs/guides/database/postgres/row-level-security
- Check WulfBidz repository issues
- Contact the development team
