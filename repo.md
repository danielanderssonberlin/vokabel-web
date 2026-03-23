# Vokabro

**Vokabro** is a modern language learning application designed for effective vocabulary training. It features an intelligent learning system, speech recognition, and multi-language support.

## Tech Stack

- **Frontend**: [React 19](https://react.dev/), [Vite](https://vitejs.dev/)
- **Backend/Database**: [Supabase](https://supabase.com/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **State Management**: Custom stores with Supabase integration
- **Routing**: [React Router 7](https://reactrouter.com/)
- **Special Features**: 
  - [react-speech-recognition](https://www.npmjs.com/package/react-speech-recognition) for voice input
  - [canvas-confetti](https://www.npmjs.com/package/canvas-confetti) for achievements

## Project Structure

- `src/screens/`: Main application views (Learning, Overview, Profile, Welcome).
- `src/components/`: Reusable UI components (Toast, LanguageSwitcher, etc.).
- `src/store/`: State management logic for users and vocabulary.
- `src/context/`: React context providers for UI language and learning language.
- `src/lib/`: External service configurations (Supabase, local storage).
- `src/constants/`: Static content and localization strings.

## Key Features

- **Intelligent Learning**: Vocabulary progression from status 0 up to 5 (Archived).
- **Archive Review**: Special mode for practicing previously learned (archived) words.
- **Speech Recognition**: Voice input support for practicing pronunciation and answers.
- **Statistics & Streaks**: Track learning progress and maintain daily streaks.
- **Localization**: Full support for German and English UI languages.
- **Mobile Optimized**: Designed with a focus on mobile usability and safe area support.

## Core Files

- `src/App.jsx`: Main entry point with routing and layout.
- `src/screens/Learning.jsx`: Core learning logic and session management.
- `src/screens/Overview.jsx`: Vocabulary management and search.
- `src/constants/uiContent.jsx`: Central location for all UI strings (DE/EN).
- `src/store/vocabularyStore.js`: Handles vocabulary CRUD and status updates.
- `src/store/userStore.js`: Manages user profiles, statistics, and streaks.
