# Security Policy

## 🔒 Protecting Your Credentials

### Environment Variables

**Never commit these files:**
- `.env`
- `.env.local`
- `.env.production`
- Any file containing actual API keys or secrets

These files are already protected by `.gitignore` in this repository.

### Setting Up Environment Variables

1. **Local Development:**
   - Copy `frontend/.env.example` to `frontend/.env`
   - Fill in your actual Supabase credentials
   - The `.env` file will be automatically ignored by git

2. **Production (Vercel):**
   - Go to your Vercel project settings
   - Navigate to "Environment Variables"
   - Add:
     - `VITE_SUPABASE_URL` = your Supabase project URL
     - `VITE_SUPABASE_ANON_KEY` = your Supabase anon key

3. **Supabase Edge Functions:**
   - Supabase automatically provides `SUPABASE_URL` and `SUPABASE_ANON_KEY` 
   - No manual configuration needed for edge functions

## 🚨 If You Accidentally Committed Credentials

If you've accidentally committed API keys or secrets:

1. **Immediately revoke/regenerate the exposed credentials** in your Supabase dashboard
2. Remove the credentials from git history:
   ```bash
   # Install git-filter-repo if needed
   pip install git-filter-repo
   
   # Remove the file from history
   git filter-repo --path frontend/.env --invert-paths
   
   # Force push to remote
   git push origin --force --all
   ```
3. Update your `.env` file with the new credentials
4. Verify `.gitignore` is working correctly

## 🔑 Supabase Security Best Practices

### Row Level Security (RLS)
- All tables have RLS policies enabled
- Users can only access data they're authorized to see
- Policies are enforced at the database level

### API Keys
- **Anon Key**: Safe for client-side use (limited permissions via RLS)
- **Service Role Key**: Never expose in frontend code
- **JWT Secret**: Keep secure, never commit to repository

### Database Security
- Use prepared statements (Supabase client handles this)
- Never expose service_role key
- Regularly review RLS policies
- Monitor database logs for suspicious activity

## 📊 Monitoring

- Enable Supabase logs in production
- Set up alerts for unusual access patterns
- Regularly review API usage in Supabase dashboard

## 📝 Reporting Security Issues

If you discover a security vulnerability:
1. **Do not** open a public GitHub issue
2. Contact the repository maintainers directly
3. Provide detailed information about the vulnerability
4. Allow time for the issue to be addressed before public disclosure

## ✅ Security Checklist

Before deploying to production:

- [ ] All `.env` files are in `.gitignore`
- [ ] No hardcoded credentials in source code
- [ ] Supabase RLS policies are enabled on all tables
- [ ] Environment variables are set in Vercel
- [ ] Service role key is not used in frontend
- [ ] Database backups are configured
- [ ] SSL/HTTPS is enabled (automatic with Vercel)
- [ ] Supabase project has strong admin password
