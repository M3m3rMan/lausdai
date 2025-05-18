// import React, { useState } from 'react';
// import { View, Text, TextInput, Button, StyleSheet, ScrollView } from 'react-native';
// import { Picker } from '@react-native-picker/picker';

// export default function App() {
//   const [name, setName] = useState('');
//   const [school, setSchool] = useState('Early College Academy');
//   const [loggedIn, setLoggedIn] = useState(false);

//   const nonTraditionalSchools = [
//     'Early College Academy',
//     'Independent Study Program',
//     'New Tech High School',
//     'City of Angels',
//     'Virtual Academy',
//     'Magnet STEM School',
//   ];

//   const rules: Record<string, string> = {
//     'Early College Academy': 'This school integrates college-level coursework with high school.',
//     'Independent Study Program': 'Students must submit weekly assignments and attend check-ins.',
//     'New Tech High School': 'Project-based learning with a tech focus.',
//     'City of Angels': 'Fully virtual with live teacher-led instruction.',
//     'Virtual Academy': 'Asynchronous online curriculum with optional tutoring.',
//     'Magnet STEM School': 'Magnet program with science and tech emphasis.',
//   };

//   const handleLogin = () => {
//     if (name.trim()) setLoggedIn(true);
//   };

//   return (
//     <ScrollView contentContainerStyle={styles.container}>
//       {!loggedIn ? (
//         <>
//           <Text style={styles.header}>Welcome to LAUSD Info Helper</Text>
//           <TextInput
//             style={styles.input}
//             placeholder="Your Name"
//             value={name}
//             onChangeText={setName}
//           />
//           <Text style={styles.label}>Select Your Child's School:</Text>
//           <View style={styles.pickerContainer}>
//             <Picker selectedValue={school} onValueChange={(val) => setSchool(val)}>
//               {nonTraditionalSchools.map((s, idx) => (
//                 <Picker.Item key={idx} label={s} value={s} />
//               ))}
//             </Picker>
//           </View>
//           <Button title="Continue" onPress={handleLogin} />
//         </>
//       ) : (
//         <>
//           <Text style={styles.header}>Hi {name},</Text>
//           <Text style={styles.label}>Here are the rules for:</Text>
//           <Text style={styles.school}>{school}</Text>
//           <Text style={styles.rules}>{rules[school]}</Text>
//         </>
//       )}
//     </ScrollView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     padding: 24,
//     justifyContent: 'center',
//   },
//   header: {
//     fontSize: 24,
//     marginBottom: 24,
//     textAlign: 'center',
//   },
//   input: {
//     borderWidth: 1,
//     borderColor: '#aaa',
//     borderRadius: 5,
//     padding: 12,
//     marginBottom: 24,
//   },
//   label: {
//     fontSize: 16,
//     marginBottom: 8,
//   },
//   pickerContainer: {
//     borderWidth: 1,
//     borderColor: '#aaa',
//     borderRadius: 5,
//     marginBottom: 24,
//   },
//   school: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     marginTop: 12,
//   },
//   rules: {
//     fontSize: 16,
//     marginTop: 8,
//     lineHeight: 22,
//   },
// });




// Aiuda SignUp and Login Screens using Expo React Native

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';

const logo = require('../../assets/logo.jpeg'); // Place your logo in the assets folder and name it accordingly

interface AuthInputProps {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
}

const AuthInput: React.FC<AuthInputProps> = ({ placeholder, value, onChangeText, secureTextEntry }) => (
  <TextInput
    style={styles.input}
    placeholder={placeholder}
    placeholderTextColor="#888"
    value={value}
    onChangeText={onChangeText}
    secureTextEntry={secureTextEntry}
  />
);

interface AuthButtonProps {
  text: string;
  onPress: () => void;
}

const AuthButton: React.FC<AuthButtonProps> = ({ text, onPress }) => (
  <TouchableOpacity style={styles.button} onPress={onPress}>
    <Text style={styles.buttonText}>{text}</Text>
  </TouchableOpacity>
);
type AuthStackParamList = {
  Login: undefined;
  SignUp: undefined;
};

type SignUpScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'SignUp'>;

export const SignUpScreen = ({ navigation }: { navigation: SignUpScreenNavigationProp }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Image source={logo} style={styles.logo} />
        <Text style={styles.title}>Create an Account</Text>
        <AuthInput placeholder="Email" value={email} onChangeText={setEmail} />
        <AuthInput placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
        <AuthButton text="Sign Up" onPress={() => { /* handle sign up */ }} />
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.switchText}>Already have an account? Login</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

type LoginScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Login'>;

export const LoginScreen = ({ navigation }: { navigation: LoginScreenNavigationProp }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Image source={logo} style={styles.logo} />
        <Text style={styles.title}>Welcome Back</Text>
        <AuthInput placeholder="Email" value={email} onChangeText={setEmail} />
        <AuthInput placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
        <AuthButton text="Login" onPress={() => { /* handle login */ }} />
        <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
          <Text style={styles.switchText}>Don't have an account? Sign Up</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fdf6e3',
  },
  scrollContainer: {
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  logo: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#002b45',
  },
  input: {
    width: '100%',
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: '#fff',
    marginBottom: 15,
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#002b45',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    marginVertical: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  switchText: {
    marginTop: 15,
    color: '#002b45',
    fontSize: 14,
  },
});

export default { SignUpScreen, LoginScreen };