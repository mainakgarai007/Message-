# Firebase/Firestore Migration Guide

This guide explains the migration from MongoDB to Firebase/Firestore and the new architecture.

## Table of Contents
1. [Overview](#overview)
2. [Key Architecture Changes](#key-architecture-changes)
3. [Setup Instructions](#setup-instructions)
4. [Security Rules](#security-rules)
5. [Data Model Changes](#data-model-changes)
6. [API Changes](#api-changes)

## Overview

The platform has been migrated from MongoDB to Firebase/Firestore to implement:
- UID-based user identification (Firebase Auth UID as document ID)
- Role-based admin system (`users/{uid}.role === "admin"`)
- Strict Firestore security rules
- Per-chat bot mode system
- Admin-only aboutMe data storage

## Key Architecture Changes

### 1. User ID & Admin Logic

**Old (MongoDB):**
- Users had auto-generated MongoDB ObjectIds
- Admin check: `user.isAdmin` boolean

**New (Firestore):**
- User document ID = Firebase Auth UID
- Admin check: `users/{uid}.role === "admin"`
- No email-based admin logic

### 2. Firestore Security Model

All access is UID-based with strict security rules:
- `users/{uid}` - Users can only access their own documents
- `aboutMe/{adminUid}` - Admin-only, can only access their own data
- `dms/{dmId}` - Members only
- `groups/{groupId}` - Members only
- Default deny for all other paths

### 3. Bot Mode System

Bot mode exists in every DM and Group independently:
- `"on"` - Always auto-reply
- `"manual"` - Never auto-reply
- `"auto"` - Smart mode (silent when admin active)

Rules:
- Each DM/Group stores its own botMode
- Changing botMode in one chat doesn't affect others
- Only admin can change botMode
- No presence-based triggers

### 4. About Me / Bot Memory

Strict rules:
- Bot can ONLY answer personal questions using `aboutMe/{adminUid}` data
- Bot must NEVER guess or learn automatically
- Fallback reply: "I'm not sure about that yet."

## Setup Instructions

### 1. Install Dependencies

```bash
npm install firebase firebase-admin
cd frontend && npm install firebase
```

### 2. Configure Firebase

Create a Firebase project at https://console.firebase.google.com/

#### Backend Configuration

Set environment variables in `.env`:

```env
FIREBASE_API_KEY=your_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id

# For production, use service account
FIREBASE_SERVICE_ACCOUNT_PATH=/path/to/serviceAccountKey.json
```

#### Frontend Configuration

The Firebase config is hardcoded in `frontend/src/config/firebase.js`. Update it with your project credentials.

### 3. Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules
```

### 4. Create Admin User

After registering a user, manually update their role in Firestore:

```javascript
// In Firestore console or via Admin SDK
db.collection('users').doc(userId).update({
  role: 'admin'
});
```

## Security Rules

The Firestore security rules are defined in `firestore.rules`:

```javascript
// Users can read any user, but only update their own
match /users/{uid} {
  allow read: if isAuthenticated();
  allow write: if isOwner(uid);
}

// AboutMe is admin-only
match /aboutMe/{adminId} {
  allow read, write: if isAdmin() && isOwner(adminId);
}

// DMs are members-only
match /dms/{dmId} {
  allow read, write: if isDMMember(dmId);
}

// Groups are members-only
match /groups/{groupId} {
  allow read, write: if isGroupMember(groupId);
}
```

## Data Model Changes

### Users Collection

**Structure:**
```
users/{uid}
  - email: string
  - displayName: string
  - replyName: string
  - role: "admin" | "user"
  - userType: "personal"
  - isVerified: boolean
  - isGhostMode: boolean
  - following: array<uid>
  - followers: array<uid>
  - blockedUsers: array<uid>
  - createdAt: timestamp
  - updatedAt: timestamp
```

### DMs Collection

**Structure:**
```
dms/{dmId}
  - members: array<uid>
  - type: "support" | "owner" | "personal"
  - botMode: "on" | "manual" | "auto"
  - isFavorite: boolean
  - isMuted: boolean
  - relationshipType: string
  - lastMessageAt: timestamp
  - createdAt: timestamp
  - updatedAt: timestamp

dms/{dmId}/messages/{messageId}
  - senderId: uid
  - content: string
  - chatType: "dm"
  - chatId: dmId
  - isAutomated: boolean
  - label: string | null
  - reactions: array<{userId, emoji}>
  - isPinned: boolean
  - isEdited: boolean
  - createdAt: timestamp
```

### Groups Collection

**Structure:**
```
groups/{groupId}
  - name: string
  - creator: uid
  - members: array<uid>
  - botMode: "on" | "manual" | "auto"
  - isMuted: boolean
  - lastMessageAt: timestamp
  - createdAt: timestamp
  - updatedAt: timestamp

groups/{groupId}/messages/{messageId}
  (same structure as DM messages)
```

### AboutMe Collection

**Structure:**
```
aboutMe/{adminUid}/facts/{factId}
  - key: string
  - value: string
  - category: "personal" | "relationships" | "preferences" | "other"
  - createdAt: timestamp
  - updatedAt: timestamp
```

## API Changes

### Authentication

**Old (MongoDB + JWT):**
```javascript
POST /api/auth/login
Body: { email, password }
Response: { token, user }
```

**New (Firebase Auth):**
```javascript
// Frontend: Use Firebase Auth SDK
signInWithEmailAndPassword(auth, email, password)

// Backend: Verify ID token
POST /api/auth/login
Body: { idToken }
Response: { token, user }
```

### User References

**Old:** `req.user.id` (MongoDB ObjectId)  
**New:** `req.user.uid` (Firebase Auth UID)

**Old:** `user._id`  
**New:** `user.id`

### Admin Checks

**Old:** `req.user.isAdmin`  
**New:** `req.user.role === 'admin'` or `req.user.isAdmin` (computed)

### Bot Mode

**Old:** `"ON"`, `"MANUAL"`, `"AUTO"`  
**New:** `"on"`, `"manual"`, `"auto"` (lowercase)

### Message Creation

**Old:**
```javascript
Message.create({
  sender: userId,
  content,
  chatType,
  chatId
})
```

**New:**
```javascript
Message.create(chatType, chatId, {
  senderId: userId,
  content
})
```

## Migration Checklist

- [x] Install Firebase dependencies
- [x] Create Firebase configuration files
- [x] Update all models to use Firestore
- [x] Update controllers to use new models
- [x] Update authentication to use Firebase Auth
- [x] Update middleware to verify Firebase ID tokens
- [x] Update Socket.io to use Firestore
- [x] Create Firestore security rules
- [x] Deploy Firestore rules
- [ ] Update frontend to use Firebase Client SDK
- [ ] Update frontend auth flow
- [ ] Test authentication
- [ ] Test admin role system
- [ ] Test per-chat botMode
- [ ] Migrate existing MongoDB data (if needed)

## Common Issues

### Issue: "Authentication error" on Socket.io connection
**Solution:** Ensure you're passing a valid Firebase ID token, not a JWT token.

### Issue: "Permission denied" errors
**Solution:** Check Firestore security rules and ensure user is authenticated with correct UID.

### Issue: Admin features not working
**Solution:** Verify user has `role: "admin"` in their Firestore document.

### Issue: Bot not responding
**Solution:** Check botMode is set correctly and admin UID is configured in automation service.

## Support

For issues or questions:
1. Check Firestore security rules logs in Firebase console
2. Check authentication state in Firebase console
3. Review server logs for errors
4. Verify Firebase configuration is correct
