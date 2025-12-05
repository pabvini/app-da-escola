import React, { useEffect, useState, useRef } from 'react';
import { SafeAreaView, View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, FlatList, Switch, Image } from 'react-native';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

const SCHOOL_CONFIG = {
  name: 'ETEMB',   
  latitude: -1.436270,   
  longitude: -48.459680,
  geofenceRadiusMeters: 200,
};

const DEFAULT_USERS = [
  { username: 'aluno1', password: '1234', role: 'student', name: 'Aluno Um' },
  { username: 'aluno2', password: '1234', role: 'student', name: 'Aluno Dois' },
  { username: 'secretaria', password: 'admin123', role: 'admin', name: 'Secretaria' },
];

const STORAGE_KEYS = {
  USERS: '@app_users_v1',
  ATTENDANCE: '@app_attendance_v1',
};

const Stack = createStackNavigator();

function distanceInMeters(lat1, lon1, lat2, lon2) {
  const toRad = v => (v * Math.PI) / 180;
  const R = 6371e3;
  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lon2 - lon1);
  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function HeaderLogo() {
  return (
    <View style={{ alignItems:'center', marginBottom:12 }}>
      <Image source={require('./logo-etemb.png')} style={{ width:90, height:90, marginBottom:6 }} resizeMode="contain"/>
    </View>
  );
}

// HOME
function HomeScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <HeaderLogo />
      <Text style={styles.title}>{SCHOOL_CONFIG.name}</Text>
      <Text style={styles.subtitle}>App da Escola — Informações e Presença</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Cursos Disponíveis</Text>
        <Text style={styles.cardText}>• Eletrotécnica</Text>
        <Text style={styles.cardText}>• Eletrônica</Text>
        <Text style={styles.cardText}>• Edificações</Text>
        <Text style={styles.cardText}>• Informática</Text>
        <Text style={styles.cardText}>• Mecânica</Text>
        <Text style={styles.cardText}>• Segurança do Trabalho</Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Cursos')}>
        <Text style={styles.buttonText}>Ver Cursos</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Login')}>
        <Text style={styles.buttonText}>Entrar / Login</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, styles.outline]} onPress={() => navigation.navigate('About')}>
        <Text style={[styles.buttonText, styles.outlineText]}>Sobre o App</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// TELA DE CURSOS
function CursosScreen() {
  const cursos = [
    { nome: "Eletrotécnica", desc: "Curso técnico voltado para sistemas elétricos, instalações e manutenção." },
    { nome: "Eletrônica", desc: "Aborda circuitos, componentes, sistemas embarcados e automação." },
    { nome: "Edificações", desc: "Focado em construção civil, projetos, obras e medições." },
    { nome: "Informática", desc: "Fundamentos de TI, programação, redes, manutenção e sistemas." },
    { nome: "Mecânica", desc: "Estudo de máquinas, motores, sistemas mecânicos e manutenção." },
    { nome: "Segurança do Trabalho", desc: "Voltado à prevenção de riscos, normas e proteção ao trabalhador." },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <HeaderLogo />
      <Text style={styles.title}>Cursos da ETEMB</Text>

      <View style={[styles.card, { width:'100%' }]}>
        <FlatList
          data={cursos}
          keyExtractor={(item, i) => String(i)}
          renderItem={({item}) => (
            <View style={{ marginBottom:14 }}>
              <Text style={{ fontWeight:'700', fontSize:16 }}>{item.nome}</Text>
              <Text style={{ color:'#444', marginTop:4 }}>{item.desc}</Text>
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

// ABOUT
function AboutScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <HeaderLogo />
      <Text style={styles.title}>Sobre o App</Text>
      <View style={styles.card}>
        <Text style={styles.cardText}>
          Este app foi criado para auxiliar alunos e secretaria da ETEMB na marcação
          de presença por geolocalização, além de disponibilizar informações dos cursos.
        </Text>
      </View>
    </SafeAreaView>
  );
}

// LOGIN
function LoginScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.USERS);
      if (!raw) {
        await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(DEFAULT_USERS));
      }
    })();
  }, []);

  const handleLogin = async () => {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.USERS);
    const users = raw ? JSON.parse(raw) : [];
    const user = users.find(u => u.username === username && u.password === password);
    if (!user) return Alert.alert("Erro", "Usuário ou senha incorretos");

    user.role === 'admin'
      ? navigation.replace('Admin', { user })
      : navigation.replace('Student', { user });
  };

  return (
    <SafeAreaView style={styles.container}>
      <HeaderLogo />
      <Text style={styles.title}>Login</Text>

      <TextInput style={styles.input} placeholder="Usuário" autoCapitalize="none" value={username} onChangeText={setUsername}/>
      <TextInput style={styles.input} placeholder="Senha" secureTextEntry value={password} onChangeText={setPassword}/>

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Entrar</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// STUDENT
function StudentScreen({ route }) {
  const { user } = route.params;
  const [attendances, setAttendances] = useState([]);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [autoCheckIn, setAutoCheckIn] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    (async () => {
      const p = await Location.requestForegroundPermissionsAsync();
      if (p.status !== 'granted') return;
      setPermissionGranted(true);
    })();

    (async () => {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.ATTENDANCE);
      const list = raw ? JSON.parse(raw) : [];
      setAttendances(list.filter(a => a.username === user.username).reverse());
    })();

    return () => intervalRef.current && clearInterval(intervalRef.current);
  }, []);

  const getLocation = async () => {
    try {
      return (await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest
      })).coords;
    } catch {
      Alert.alert('Erro', 'Não foi possível obter localização.');
      return null;
    }
  };

  const markAttendance = async (coords, method = 'manual') => {
    const d = new Date();
    const record = {
      username: user.username,
      name: user.name,
      timestamp: d.toISOString(),
      latitude: coords.latitude,
      longitude: coords.longitude,
      method,
    };

    const raw = await AsyncStorage.getItem(STORAGE_KEYS.ATTENDANCE);
    const list = raw ? JSON.parse(raw) : [];
    list.push(record);
    await AsyncStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(list));

    setAttendances(prev => [record, ...prev]);
    Alert.alert("Presença registrada", `(${method}) em ${d.toLocaleString()}`);
  };

  const handleCheckIn = async () => {
    if (!permissionGranted) return Alert.alert("Permissão", "Ative a localização.");

    const coords = await getLocation();
    if (!coords) return;

    const dist = distanceInMeters(coords.latitude, coords.longitude, SCHOOL_CONFIG.latitude, SCHOOL_CONFIG.longitude);

    if (dist <= SCHOOL_CONFIG.geofenceRadiusMeters) {
      return markAttendance(coords, 'geofence');
    }

    Alert.alert(
      "Fora da escola",
      `Você está a ${Math.round(dist)} m. Deseja registrar manualmente?`,
      [
        { text: "Sim", onPress: () => markAttendance(coords, 'manual') },
        { text: "Cancelar" }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <HeaderLogo />
      <Text style={styles.title}>Bem-vindo, {user.name}</Text>
      <Text style={styles.subtitle}>Escola: {SCHOOL_CONFIG.name}</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Checar Presença</Text>
        <TouchableOpacity style={styles.button} onPress={handleCheckIn}>
          <Text style={styles.buttonText}>Registrar Presença</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.card, { flex:1 }]}>
        <Text style={styles.cardTitle}>Histórico</Text>

        <FlatList
          data={attendances}
          keyExtractor={(item, i) => String(i)}
          renderItem={({item}) => (
            <View style={{ marginBottom:8 }}>
              <Text style={{ fontWeight:'700' }}>
                {item.name} — {new Date(item.timestamp).toLocaleString()}
              </Text>
              <Text style={{ fontSize:12 }}>
                Método: {item.method}
                {"\n"}Lat: {item.latitude.toFixed(4)} | Lon: {item.longitude.toFixed(4)}
              </Text>
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

// ADMIN
function AdminScreen() {
  const [attendance, setAttendance] = useState([]);

  useEffect(() => {
    const load = async () => {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.ATTENDANCE);
      setAttendance(raw ? JSON.parse(raw).reverse() : []);
    };
    load();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <HeaderLogo />
      <Text style={styles.title}>Painel da Secretaria</Text>

      <View style={{ flex:1, width:'100%' }}>
        <FlatList
          data={attendance}
          keyExtractor={(item, i) => String(i)}
          renderItem={({item}) => (
            <View style={{ padding:10, borderBottomWidth:1, borderColor:'#ddd' }}>
              <Text style={{ fontWeight:'700' }}>
                {item.name} — {new Date(item.timestamp).toLocaleString()}
              </Text>
              <Text style={{ fontSize:12 }}>
                Usuário: {item.username} • Método: {item.method}
              </Text>
              <Text style={{ fontSize:12 }}>
                Lat: {item.latitude.toFixed(4)} • Lon: {item.longitude.toFixed(4)}
              </Text>
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

// APP
export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">

        <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown:false }} />
        <Stack.Screen name="Cursos" component={CursosScreen} options={{ headerShown:false }} />
        <Stack.Screen name="About" component={AboutScreen} options={{ headerShown:false }} />
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown:false }} />
        <Stack.Screen name="Student" component={StudentScreen} options={{ headerShown:false }} />
        <Stack.Screen name="Admin" component={AdminScreen} options={{ headerShown:false }} />

      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, alignItems:'center', padding:16, backgroundColor:'#f9fbfd' },
  title: { fontSize:22, fontWeight:'700', marginBottom:6 },
  subtitle: { fontSize:14, color:'#444', marginBottom:12 },
  input: { width:'100%', padding:12, borderWidth:1, borderColor:'#ccc', borderRadius:8, marginTop:8, backgroundColor:'#fff' },
  button: { backgroundColor:'#2a9df4', padding:12, borderRadius:8, width:'100%', alignItems:'center', marginTop:10 },
  buttonText: { color:'#fff', fontWeight:'700' },
  outline: { backgroundColor:'#fff', borderWidth:1, borderColor:'#2a9df4', marginTop:10 },
  outlineText: { color:'#2a9df4' },
  card: { width:'100%', backgroundColor:'#fff', padding:14, borderRadius:8, marginBottom:12, elevation:2 }
});
