# Vokabro - Development Guide

## Project Overview
**Vokabro** is a vocabulary learning application built with React, Vite, and Supabase. It features an intelligent learning system with progression-based vocabulary tracking and speech recognition support.

## Core Concepts & Logic
- **Vocabulary Status**: Words progress from **Status 0** to **Status 5** (Archived).
- **Status Increment**: Status increases on correct answers only if the last review was more than 12 hours ago (to prevent "gaming" the system), unless `disable_too_soon` is enabled in the user profile.
- **Data Model**: The `vocabulary` table in Supabase uses `german` and `spanish` as column names, where `spanish` often acts as a generic field for the foreign word regardless of the selected target language.
- **UI Languages**: Supports German (DE) and English (EN) for the interface.

## Tech Stack
- **Frontend**: React 19, Vite, Tailwind CSS 4
- **Backend/Auth**: Supabase
- **Icons**: Lucide React
- **Voice**: `react-speech-recognition`
- **Routing**: React Router 7

## Key Commands
- `npm run dev`: Starts the development server.
- `npm run build`: Builds the application for production.
- `npm run lint`: Runs ESLint for code quality checks.
- `npm run storybook`: Starts the Storybook development environment.

## Project Structure
- `src/screens/`: Main views (`Learning.jsx`, `Overview.jsx`, `Profile.jsx`).
- `src/store/`: Logic for data fetching and state updates (Supabase integration).
- `src/constants/`: UI strings (`uiContent.jsx`) and static data.
- `src/components/`: Reusable UI components.
- `src/context/`: Context providers for language settings.

## Code Conventions
- Use **Tailwind CSS** for all styling.
- Use **Lucide React** for icons.
- Prefer **Functional Components** and React Hooks.
- Centralize UI strings in `src/constants/uiContent.jsx` for localization.
- Handle database operations through store functions in `src/store/`.
