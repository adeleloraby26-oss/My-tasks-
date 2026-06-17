# My Tasks App 📋

A beautiful, offline-first task management app with Supabase backend.

## Stack
- **React Native + Expo** (TypeScript)
- **Supabase** (Auth + Database + Storage + Realtime)
- **EAS Build** (Cloud builds — no computer needed)
- **Zustand** (State + offline queue)
- **React Native Reanimated** (Spring animations)
- **Expo Linear Gradient** (Colorful cards)

---

## Setup (Mobile-first, no computer needed)

### 1. Supabase Setup
1. Go to [supabase.com](https://supabase.com) → New project
2. Go to **SQL Editor** → paste contents of `supabase/schema.sql` → Run
3. Copy your **Project URL** and **anon key** from Settings → API

### 2. Update `app.json`
```json
"extra": {
  "supabaseUrl": "https://xxxx.supabase.co",
  "supabaseAnonKey": "your-anon-key",
  "eas": {
    "projectId": "your-eas-project-id"
  }
}
```

### 3. EAS Build (from mobile GitHub)
1. Push project to GitHub
2. Go to [expo.dev](https://expo.dev) → Create project → link GitHub repo
3. Run via EAS dashboard or:
```bash
eas build --platform android --profile preview
```

---

## Features

### ✅ Authentication
- Email/password signup & login
- Username + display name on signup
- Avatar upload to Supabase Storage
- Auto-creates profile on signup via Postgres trigger

### ✅ Tasks
- Create with title, description, priority, due date, board
- Complete with **animated checkmark burst** (SVG + Reanimated)
- Swipe left to delete
- Filter by status: All / Pending / In Progress / Completed
- Search by title
- Overdue badge (red)
- Offline indicator badge

### ✅ Offline Support
- All data cached in AsyncStorage
- Optimistic updates (instant UI)
- Offline queue flushed when back online
- NetInfo watches connection

### ✅ Boards
- Color-coded project boards
- Assign tasks to boards

### ✅ Analytics Dashboard
- Total tasks, completion rate, overdue, active boards
- Donut chart: status distribution
- Bar chart: priority distribution
- Progress bar

### ✅ Profile
- Edit display name & username
- Upload avatar (camera or gallery)
- Light / Dark mode toggle (AMOLED true black)
- Sign out

---

## App Icon
Three-layer design matching the uploaded logo:
- 🟡 Yellow top layer
- 🟣 Purple middle layer  
- ⚫ Black bottom layer with white checkmark

---

## Color Palette
| Color   | Hex       | Use                    |
|---------|-----------|------------------------|
| Blue    | `#4A90E2` | Total Boards, Accent   |
| Green   | `#27AE60` | Completed Tasks        |
| Orange  | `#F39C12` | Pending Tasks          |
| Purple  | `#8B7FD4` | Completion Rate, Logo  |
| Red     | `#E74C3C` | Overdue Tasks          |
| Yellow  | `#F5D78E` | Logo top layer         |

---

## File Structure
```
my-tasks-app/
├── app/
│   ├── _layout.tsx        # Root: auth listener + offline sync
│   └── AppNavigator.tsx   # Bottom tab navigator
├── src/
│   ├── screens/
│   │   ├── AuthScreen.tsx
│   │   ├── HomeScreen.tsx
│   │   ├── TasksScreen.tsx
│   │   ├── NewTaskScreen.tsx
│   │   ├── AnalyticsScreen.tsx
│   │   └── ProfileScreen.tsx
│   ├── components/
│   │   ├── TaskCard.tsx           # Swipe + complete animation
│   │   ├── StatCard.tsx           # Colorful gradient stat card
│   │   └── TaskCompleteAnimation.tsx  # SVG checkmark burst
│   ├── store/
│   │   └── useAppStore.ts         # Zustand + offline queue
│   ├── services/
│   │   └── supabase.ts
│   ├── types/
│   │   └── index.ts
│   └── utils/
│       └── theme.ts               # Colors, spacing, dark/light
├── supabase/
│   └── schema.sql                 # Full DB schema
├── assets/
│   └── icon.svg                   # App icon (3-layer design)
├── app.json
├── eas.json
└── babel.config.js
```
