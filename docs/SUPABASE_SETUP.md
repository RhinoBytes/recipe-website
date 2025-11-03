# Supabase Storage Setup Guide

This guide will walk you through setting up Supabase Storage for the Recipe Website application.

## Overview

The Recipe Website uses Supabase Storage for:
- Recipe images and media uploads
- User profile avatars
- Secure file storage with public access

## Prerequisites

1. A Supabase account (sign up at https://supabase.com)
2. A Supabase project created
3. Node.js and npm installed

## Step 1: Get Your Supabase Credentials

1. Go to your Supabase project dashboard at https://app.supabase.com
2. Navigate to **Project Settings** → **API**
3. You'll need these values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (for client-side operations)
   - **service_role key** (for server-side operations with admin privileges)

## Step 2: Configure Environment Variables

1. Copy the `.env.example` file to create your `.env` file:
   ```bash
   cp .env.example .env
   ```

2. Update the Supabase environment variables in `.env`:
   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL="https://your-project-ref.supabase.co"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key-here"
   SUPABASE_SERVICE_KEY="your-service-role-key-here"
   ```

   **Important Notes:**
   - `NEXT_PUBLIC_SUPABASE_URL`: Your project URL from Step 1
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: The anon/public key (safe to expose in client-side code)
   - `SUPABASE_SERVICE_KEY`: The service_role key (**KEEP THIS SECRET** - only use server-side)

## Step 3: Create Storage Bucket

1. In your Supabase dashboard, navigate to **Storage** from the left sidebar
2. Click **New Bucket**
3. Create a bucket with these settings:
   - **Name**: `recipe-builder`
   - **Public bucket**: ✅ Enable (allows public read access to uploaded files)
   - **File size limit**: Set according to your needs (recommended: 50 MB)
   - **Allowed MIME types**: Leave empty or specify `image/*` for images only

4. Click **Create bucket**

## Step 4: Configure Storage Policies (Security)

Supabase Storage uses Row Level Security (RLS) policies. Here are the recommended policies:

### Allow Public Read Access

This allows anyone to view uploaded files (necessary for recipe images):

```sql
-- Allow public read access to all files
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'recipe-builder');
```

### Allow Authenticated Users to Upload

This allows logged-in users to upload files:

```sql
-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'recipe-builder');
```

### Allow Users to Update/Delete Their Own Files

This allows users to manage their own uploads:

```sql
-- Allow users to update their own files
CREATE POLICY "Users can update own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'recipe-builder' AND auth.uid()::text = owner);

-- Allow users to delete their own files
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'recipe-builder' AND auth.uid()::text = owner);
```

**Note**: Since this application uses a custom JWT authentication system (not Supabase Auth), you may need to use the service role key for server-side operations instead of relying on these RLS policies.

## Step 5: Folder Structure

The application organizes files in the following structure:

```
recipe-builder/
├── recipes/
│   ├── {recipeId}/
│   │   ├── {timestamp}-{random}.jpg
│   │   └── ...
├── uploads/
│   ├── {timestamp}-{random}.jpg
│   └── ...
└── avatars/
    ├── {userId}/
    │   └── {timestamp}-{random}.jpg
    └── ...
```

## Step 6: Test the Setup

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Create an account or log in to the application
3. Try uploading a recipe image
4. Check your Supabase Storage dashboard to verify the file was uploaded

## Architecture Overview

### Client-Side Implementation (`lib/supabase/client.ts`)

The client-side Supabase client uses the **anon key** and respects Row Level Security policies:

```typescript
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

**Use cases:**
- User-initiated file uploads from the browser
- Client-side interactions with storage
- Respects RLS policies

### Server-Side Implementation (`lib/supabase/server.ts`)

The server-side admin client uses the **service role key** and bypasses RLS:

```typescript
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || "";

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
```

**Use cases:**
- Server-side file operations
- Database seeding scripts
- Administrative operations
- Bypasses RLS for trusted operations

## Common Operations

### Upload a File

```typescript
import { supabase } from "@/lib/supabase/client";

const file = /* File object from input */;
const filePath = `recipes/${recipeId}/${Date.now()}-${file.name}`;

const { data, error } = await supabase.storage
  .from("recipe-builder")
  .upload(filePath, file, {
    cacheControl: "3600",
    upsert: false,
  });
```

### Get Public URL

```typescript
const { data } = supabase.storage
  .from("recipe-builder")
  .getPublicUrl(filePath);

console.log(data.publicUrl);
```

### Delete a File

```typescript
const { error } = await supabase.storage
  .from("recipe-builder")
  .remove([filePath]);
```

## Troubleshooting

### Error: "Invalid Compact JWS"

This error occurs when the Supabase API keys are not properly configured. This is the most common error.

**Root Cause**: The `SUPABASE_SERVICE_KEY` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` in your `.env` file is either:
- Empty (blank)
- Set to the placeholder value (e.g., "your-service-role-key")
- Invalid or expired

**Solution**: 
1. Check your `.env` file and ensure both keys are set to actual values from your Supabase project
2. Go to https://app.supabase.com/project/_/settings/api
3. Copy the **anon public** key and paste it into `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Copy the **service_role** key and paste it into `SUPABASE_SERVICE_KEY`
5. Save the `.env` file and restart your application

Example of a properly configured `.env`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Error: "NEXT_PUBLIC_SUPABASE_URL is not configured"

**Solution**: Ensure you've created the `.env` file and set the `NEXT_PUBLIC_SUPABASE_URL` variable.

### Error: "NEXT_PUBLIC_SUPABASE_ANON_KEY is not configured"

**Solution**: Add your Supabase anon key to the `.env` file.

### Error: "SUPABASE_SERVICE_KEY is not configured"

**Solution**: Add your Supabase service role key to the `.env` file. This error typically occurs during server-side operations or seeding.

### Error: "Bucket not found"

**Solution**: Ensure you've created the `recipe-builder` bucket in your Supabase Storage dashboard (see Step 3).

### Upload fails with permission error

**Solution**: Check your RLS policies in Supabase. Ensure you have the correct policies set up (see Step 4).

### Files not loading in browser

**Solution**: 
1. Ensure the bucket is set to **public**
2. Check that you're using the correct public URL from `getPublicUrl()`
3. Verify there are no CORS issues in your Supabase project settings

## Security Best Practices

1. **Never commit `.env` file**: The `.env` file is in `.gitignore` by default
2. **Keep service role key secret**: Only use on server-side, never expose to client
3. **Use anon key for client-side**: The `NEXT_PUBLIC_` prefix exposes it to the browser
4. **Validate file types**: Always validate file types and sizes before upload
5. **Implement rate limiting**: Prevent abuse of upload endpoints
6. **Use signed URLs for private files**: For sensitive files, use signed URLs instead of public URLs

## Resources

- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
- [Supabase Storage API Reference](https://supabase.com/docs/reference/javascript/storage)
- [Row Level Security Policies](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)
