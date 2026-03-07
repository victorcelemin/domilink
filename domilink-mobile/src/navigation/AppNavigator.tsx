import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';
import { LoadingScreen } from '../components/common/LoadingScreen';

// Auth
import { WelcomeScreen } from '../screens/auth/WelcomeScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { OtpScreen } from '../screens/auth/OtpScreen';

// Company
import { CompanyHomeScreen } from '../screens/company/CompanyHomeScreen';
import { CompanyProfileScreen } from '../screens/company/CompanyProfileScreen';
import { CreateOrderScreen } from '../screens/company/CreateOrderScreen';
import { OrderDetailScreen } from '../screens/company/OrderDetailScreen';

// Courier
import { CourierHomeScreen } from '../screens/courier/CourierHomeScreen';
import { CourierProfileScreen } from '../screens/courier/CourierProfileScreen';
import { TakeOrderScreen } from '../screens/courier/TakeOrderScreen';
import { CourierDeliveryScreen } from '../screens/courier/CourierDeliveryScreen';

const Stack = createStackNavigator();

const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Welcome" component={WelcomeScreen} />
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
    <Stack.Screen name="Otp" component={OtpScreen} />
  </Stack.Navigator>
);

const CompanyStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="CompanyHome" component={CompanyHomeScreen} />
    <Stack.Screen name="CompanyProfile" component={CompanyProfileScreen} />
    <Stack.Screen name="CreateOrder" component={CreateOrderScreen} />
    <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
  </Stack.Navigator>
);

const CourierStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="CourierHome" component={CourierHomeScreen} />
    <Stack.Screen name="CourierProfile" component={CourierProfileScreen} />
    <Stack.Screen name="TakeOrder" component={TakeOrderScreen} />
    <Stack.Screen name="CourierDelivery" component={CourierDeliveryScreen} />
    <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
  </Stack.Navigator>
);

export const AppNavigator = () => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) return <LoadingScreen message="Iniciando DomiLink..." />;

  return (
    <NavigationContainer>
      {!isAuthenticated
        ? <AuthStack />
        : user?.role === 'COMPANY'
        ? <CompanyStack />
        : <CourierStack />
      }
    </NavigationContainer>
  );
};
