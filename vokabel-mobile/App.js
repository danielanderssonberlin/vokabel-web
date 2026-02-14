import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GraduationCap, BookOpen, User } from 'lucide-react-native';
import { supabase } from './lib/supabase';

import { Colors } from './constants/Theme';

import Learning from './screens/Learning';
import Overview from './screens/Overview';
import Profile from './screens/Profile';
import Login from './screens/Login';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          if (route.name === 'Lernen') return <GraduationCap size={size} color={color} />;
          if (route.name === 'Übersicht') return <BookOpen size={size} color={color} />;
          if (route.name === 'Profil') return <User size={size} color={color} />;
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        headerShown: false,
        tabBarStyle: {
          height: 85,
          paddingBottom: 25,
          paddingTop: 10,
          backgroundColor: Colors.surface,
          borderTopColor: Colors.borderLight,
        }
      })}
    >
      <Tab.Screen name="Lernen" component={Learning} />
      <Tab.Screen name="Übersicht" component={Overview} />
      <Tab.Screen name="Profil" component={Profile} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  if (loading) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!session ? (
          <Stack.Screen name="Login" component={Login} />
        ) : (
          <Stack.Screen name="Main" component={MainTabs} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
