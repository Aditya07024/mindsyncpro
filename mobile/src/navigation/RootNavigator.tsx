import React from 'react';
import { Platform, useWindowDimensions } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Animated, { useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { createBottomTabNavigator, BottomTabBar, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, MessageSquare, Compass, Calendar, DollarSign, Briefcase, Award, ShieldAlert, Smile, User, Users, UserCheck } from 'lucide-react-native';
import { Theme } from '../theme';
import { TabBarVisibilityProvider, useTabBarVisibility } from '../context/TabBarVisibilityContext';

// Pre-login screens
import LandingScreen from '../screens/landing/LandingScreen';
import AboutScreen from '../screens/landing/AboutScreen';
import PlansScreen from '../screens/landing/PlansScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import ClerkAuthScreen from '../screens/auth/ClerkAuthScreen';
import OnboardingScreen from '../screens/auth/OnboardingScreen';
import TherapistOnboardingScreen from '../screens/auth/TherapistOnboardingScreen';
import OrgOnboardingScreen from '../screens/auth/OrgOnboardingScreen';

// Seeker / Individual screens
import UserDashboardScreen from '../screens/user/DashboardScreen';
import ChatScreen from '../screens/user/ChatScreen';
import TherapistListScreen from '../screens/user/TherapistListScreen';
import TherapistDetailScreen from '../screens/user/TherapistDetailScreen';
import BookingScreen from '../screens/user/BookingScreen';
import UserBookingsScreen from '../screens/user/UserBookingsScreen';
import BreatheScreen from '../screens/user/BreatheScreen';
import CBTJournalScreen from '../screens/user/CBTJournalScreen';
import MoodDiaryScreen from '../screens/user/MoodDiaryScreen';
import UserProfileScreen from '../screens/user/UserProfileScreen';
import NotificationInboxScreen from '../screens/user/NotificationInboxScreen';
import SessionScreen from '../screens/user/SessionScreen';
import WalletScreen from '../screens/user/WalletScreen';
import ReportsScreen from '../screens/user/ReportsScreen';
import GroupSessionsScreen from '../screens/shared/GroupSessionsScreen';
import GroupAudioRoomScreen from '../screens/shared/GroupAudioRoomScreen';

// Therapist screens
import TherapistDashboardScreen from '../screens/therapist/TherapistDashboardScreen';
import TherapistBriefScreen from '../screens/therapist/TherapistBriefScreen';
import TherapistScheduleScreen from '../screens/therapist/TherapistScheduleScreen';
import TherapistEarningsScreen from '../screens/therapist/TherapistEarningsScreen';
import TherapistProfileScreen from '../screens/therapist/TherapistProfileScreen';

// Org screens
import OrgDashboardScreen from '../screens/org/OrgDashboardScreen';
import OrgTherapistsScreen from '../screens/org/OrgTherapistsScreen';
import OrgRequestsScreen from '../screens/org/OrgRequestsScreen';
import OrgMembersScreen from '../screens/org/OrgMembersScreen';

// Super admin screens
import SuperAdminOverviewScreen from '../screens/admin/SuperAdminOverviewScreen';
import SuperAdminApprovalsScreen from '../screens/admin/SuperAdminApprovalsScreen';
import SuperAdminSubscriptionsScreen from '../screens/admin/SuperAdminSubscriptionsScreen';
import SuperAdminPlansScreen from '../screens/admin/SuperAdminPlansScreen';
import SuperAdminEarningsScreen from '../screens/admin/SuperAdminEarningsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Smooth Animated Tab Bar Container for auto-hide/reveal on scroll
const AnimatedBottomTabBar = (props: BottomTabBarProps) => {
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const bottomMargin = Math.max(insets.bottom - 14, 10);
  const horizontalOffset = Math.round(windowWidth * 0.05);

  const { translateY } = useTabBarVisibility();

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          bottom: bottomMargin,
          left: horizontalOffset,
          right: horizontalOffset,
          zIndex: 1000,
        },
        animatedStyle,
      ]}
    >
      <BottomTabBar {...props} />
    </Animated.View>
  );
};

// 1. User Bottom Navigator
const UserTabNavigator = () => {
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const bottomMargin = Math.max(insets.bottom - 14, 10);
  const horizontalOffset = Math.round(windowWidth * 0.05);
  
  return (
    <Tab.Navigator
      tabBar={(props) => <AnimatedBottomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Theme.colors.primary,
        tabBarInactiveTintColor: '#64748B',
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderRadius: 28,
          height: 68,
          paddingBottom: 6,
          paddingTop: 6,
          borderTopWidth: 0,
          borderWidth: 1,
          borderColor: '#E2E8F0',
          shadowColor: '#0F172A',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.12,
          shadowRadius: 16,
          elevation: 10,
        },
        tabBarItemStyle: {
          justifyContent: 'center',
          alignItems: 'center',
          paddingVertical: 0,
        },
        tabBarLabelStyle: {
          fontFamily: Theme.fonts.bodyBold,
          fontSize: 10,
          marginTop: 1,
          marginBottom: 0,
        }
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={UserDashboardScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color }) => <Home size={19} color={color} />
        }}
      />
      <Tab.Screen 
        name="Chat" 
        component={ChatScreen}
        options={{
          tabBarLabel: 'Manas AI',
          tabBarIcon: ({ color }) => <MessageSquare size={19} color={color} />
        }}
      />
      <Tab.Screen 
        name="Therapists" 
        component={TherapistListScreen}
        options={{
          tabBarLabel: 'Therapists',
          tabBarIcon: ({ color }) => <Compass size={19} color={color} />
        }}
      />
      <Tab.Screen 
        name="Bookings" 
        component={UserBookingsScreen}
        options={{
          tabBarLabel: 'Sessions',
          tabBarIcon: ({ color }) => <Calendar size={19} color={color} />
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={UserProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color }) => <User size={19} color={color} />
        }}
      />
    </Tab.Navigator>
  );
};

// 2. Therapist Bottom Navigator
const TherapistTabNavigator = () => {
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const bottomMargin = Math.max(insets.bottom - 14, 10);
  const horizontalOffset = Math.round(windowWidth * 0.05);

  return (
    <Tab.Navigator
      tabBar={(props) => <AnimatedBottomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Theme.colors.primary,
        tabBarInactiveTintColor: '#64748B',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderRadius: 28,
          height: 68,
          paddingBottom: 6,
          paddingTop: 6,
          borderTopWidth: 0,
          borderWidth: 1,
          borderColor: '#E2E8F0',
          shadowColor: '#0F172A',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.12,
          shadowRadius: 16,
          elevation: 10,
        },
        tabBarItemStyle: {
          justifyContent: 'center',
          alignItems: 'center',
          paddingVertical: 0,
        },
        tabBarLabelStyle: {
          fontFamily: Theme.fonts.bodyBold,
          fontSize: 10,
          marginTop: 1,
          marginBottom: 0,
        }
      }}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={TherapistDashboardScreen}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color }) => <Briefcase size={19} color={color} />
        }}
      />
      <Tab.Screen 
        name="Schedule" 
        component={TherapistScheduleScreen}
        options={{
          tabBarLabel: 'Schedule',
          tabBarIcon: ({ color }) => <Calendar size={19} color={color} />
        }}
      />
      <Tab.Screen 
        name="Earnings" 
        component={TherapistEarningsScreen}
        options={{
          tabBarLabel: 'Earnings',
          tabBarIcon: ({ color }) => <DollarSign size={19} color={color} />
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={TherapistProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color }) => <User size={19} color={color} />
        }}
      />
    </Tab.Navigator>
  );
};

// 3. Org Bottom Navigator
const OrgTabNavigator = () => {
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const bottomMargin = Math.max(insets.bottom - 14, 10);
  const horizontalOffset = Math.round(windowWidth * 0.05);

  return (
    <Tab.Navigator
      tabBar={(props) => <AnimatedBottomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Theme.colors.primary,
        tabBarInactiveTintColor: '#64748B',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderRadius: 30,
          height: 68,
          paddingBottom: 6,
          paddingTop: 6,
          borderTopWidth: 0,
          borderWidth: 1,
          borderColor: '#E2E8F0',
          shadowColor: '#0F172A',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.12,
          shadowRadius: 16,
          elevation: 10,
        },
        tabBarItemStyle: {
          justifyContent: 'center',
          alignItems: 'center',
          paddingVertical: 0,
        },
        tabBarLabelStyle: {
          fontFamily: Theme.fonts.bodyBold,
          fontSize: 10,
          marginTop: 1,
          marginBottom: 0,
        }
      }}
    >
      <Tab.Screen 
        name="Overview" 
        component={OrgDashboardScreen}
        options={{
          tabBarLabel: 'Overview',
          tabBarIcon: ({ color }) => <Award size={19} color={color} />
        }}
      />
      <Tab.Screen 
        name="Therapists" 
        component={OrgTherapistsScreen}
        options={{
          tabBarLabel: 'Therapists',
          tabBarIcon: ({ color, size }) => <Smile size={size} color={color} />
        }}
      />
      <Tab.Screen 
        name="Requests" 
        component={OrgRequestsScreen}
        options={{
          tabBarLabel: 'Requests',
          tabBarIcon: ({ color, size }) => <UserCheck size={size} color={color} />
        }}
      />
      <Tab.Screen 
        name="Members" 
        component={OrgMembersScreen}
        options={{
          tabBarLabel: 'Members',
          tabBarIcon: ({ color, size }) => <Users size={size} color={color} />
        }}
      />
    </Tab.Navigator>
  );
};

// 4. Super Admin Bottom Navigator
const AdminTabNavigator = () => {
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === 'android' ? Math.max(insets.bottom, 15) : Math.max(insets.bottom, 8);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Theme.colors.primary,
        tabBarInactiveTintColor: Theme.colors.outline,
        tabBarStyle: {
          backgroundColor: '#FFF',
          borderTopWidth: 1,
          borderTopColor: Theme.colors.surfaceHigh,
          height: 60 + bottomPadding,
          paddingBottom: bottomPadding,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontFamily: Theme.fonts.bodyBold,
          fontSize: 10,
        }
      }}
    >
      <Tab.Screen 
        name="AdminOverview" 
        component={SuperAdminOverviewScreen}
        options={{
          tabBarLabel: 'Overview',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />
        }}
      />
      <Tab.Screen 
        name="AdminApprovals" 
        component={SuperAdminApprovalsScreen}
        options={{
          tabBarLabel: 'Approvals',
          tabBarIcon: ({ color, size }) => <UserCheck size={size} color={color} />
        }}
      />
      <Tab.Screen 
        name="AdminEarnings" 
        component={SuperAdminEarningsScreen}
        options={{
          tabBarLabel: 'Earnings',
          tabBarIcon: ({ color, size }) => <DollarSign size={size} color={color} />
        }}
      />
      <Tab.Screen 
        name="AdminSubscriptions" 
        component={SuperAdminSubscriptionsScreen}
        options={{
          tabBarLabel: 'Subs',
          tabBarIcon: ({ color, size }) => <Award size={size} color={color} />
        }}
      />
      <Tab.Screen 
        name="AdminPlans" 
        component={SuperAdminPlansScreen}
        options={{
          tabBarLabel: 'Plans',
          tabBarIcon: ({ color, size }) => <Briefcase size={size} color={color} />
        }}
      />
    </Tab.Navigator>
  );
};

// 5. Main Root Navigator Stack
export const RootNavigator = () => {
  return (
    <TabBarVisibilityProvider>
      <Stack.Navigator
        initialRouteName="Landing"
        screenOptions={{
          headerShown: false,
        }}
      >
        {/* Pre-login stack */}
        <Stack.Screen name="Landing" component={LandingScreen} />
        <Stack.Screen name="About" component={AboutScreen} />
        <Stack.Screen name="Plans" component={PlansScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="ClerkAuth" component={ClerkAuthScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="TherapistOnboarding" component={TherapistOnboardingScreen} />
        <Stack.Screen name="OrgOnboarding" component={OrgOnboardingScreen} />

        {/* Post-login tab shell stack */}
        <Stack.Screen name="UserTabs" component={UserTabNavigator} />
        <Stack.Screen name="TherapistTabs" component={TherapistTabNavigator} />
        <Stack.Screen name="OrgTabs" component={OrgTabNavigator} />
        <Stack.Screen name="AdminTabs" component={AdminTabNavigator} />

        {/* Seeker details and modals */}
        <Stack.Screen name="TherapistDetail" component={TherapistDetailScreen} />
        <Stack.Screen name="Booking" component={BookingScreen} />
        <Stack.Screen name="Breathe" component={BreatheScreen} />
        <Stack.Screen name="Journal" component={CBTJournalScreen} />
        <Stack.Screen name="Wallet" component={WalletScreen} />
        <Stack.Screen name="Reports" component={ReportsScreen} />
        <Stack.Screen name="MoodDiary" component={MoodDiaryScreen} />
        <Stack.Screen name="Mood" component={MoodDiaryScreen} />

        {/* Practitioner specialized overlays */}
        <Stack.Screen name="TherapistBrief" component={TherapistBriefScreen} />

        {/* Shared authed screens */}
        <Stack.Screen name="Notifications" component={NotificationInboxScreen} />
        <Stack.Screen name="Session" component={SessionScreen} />
        <Stack.Screen name="GroupSessions" component={GroupSessionsScreen} />
        <Stack.Screen name="GroupAudioRoom" component={GroupAudioRoomScreen} />
      </Stack.Navigator>
    </TabBarVisibilityProvider>
  );
};

export default RootNavigator;
