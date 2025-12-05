// App.js
import React, { useEffect, useState, useRef } from 'react';
import { SafeAreaView, View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, FlatList, Switch } from 'react-native';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// CONFIGURAÇÕES DO APP (edite conforme necessário)
const SCHOOL_CONFIG = {
  name: 'Escola Exemplo',
  // coloque as coordenadas reais da sua escola aqui
  latitude: -1.4558,
  longitude: -48.5044,
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
  const d = R * c;
  return d;
}

// Home
function HomeScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>{SCHOOL_CONFIG.name}</Text>
      <Text style={styles.subtitle}>App da Escola — Informações e Presença</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Cursos Disponíveis</Text>
        <Text style={styles.cardText}>• Administração</Text>
        <Text style={styles.cardText}>• Informática</Text>
        <Text style={styles.cardText}>• Mecânica</Text>
        <Text style={styles.cardText}>• Edificações</Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Login')}>
        <Text style={styles.buttonText}>Entrar / Login</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, styles.outline]} onPress={() => navigation.navigate('About')}>
        <Text style={[styles.buttonText, styles.outlineText]}>Sobre o App</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

function AboutScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Sobre o App</Text>
      <View style={styles.card}>
        <Text style={styles.cardText}>Este app é um protótipo para controlar presença de alunos e divulgar informações sobre cursos. Ele usa armazenamento local (AsyncStorage) e geolocalização (Expo Location) para marcar presença quando o aluno estiver nas proximidades da escola.</Text>
      </View>
    </SafeAreaView>
  );
}

// Login
function LoginScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEYS.USERS);
        if (!raw) {
          await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(DEFAULT_USERS));
        }
      } catch (e) {
        console.log('seed error', e);
      }
    })();
  }, []);

  const handleLogin = async () => {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.USERS);
    const users = raw ? JSON.parse(raw) : [];
    const user = users.find(u => u.username === username && u.password === password);
    if (!user) {
      Alert.alert('Erro', 'Usuário ou senha incorretos');
      return;
    }
    if (user.role === 'admin') {
      navigation.replace('Admin', { user });
    } else {
      navigation.replace('Student', { user });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Login</Text>
      <TextInput placeholder="Usuário" value={username} onChangeText={setUsername} style={styles.input} autoCapitalize="none" />
      <TextInput placeholder="Senha" value={password} onChangeText={setPassword} secureTextEntry style={styles.input} />

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Entrar</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, styles.outline]} onPress={() => Alert.alert('Conta de teste', 'Use aluno1/1234 ou secretaria/admin123')}>
        <Text style={[styles.buttonText, styles.outlineText]}>Ajuda</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// Student screen
function StudentScreen({ route }) {
  const { user } = route.params;
  const [location, setLocation] = useState(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [attendances, setAttendances] = useState([]);
  const [autoCheckIn, setAutoCheckIn] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    (async () => {
      const status = await Location.requestForegroundPermissionsAsync();
      if (status.status !== 'granted') {
        Alert.alert('Permissão negada', 'Permissão de localização é necessária para marcar presença.');
        return;
      }
      setPermissionGranted(true);
    })();

    (async () => {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.ATTENDANCE);
      const list = raw ? JSON.parse(raw) : [];
      const my = list.filter(a => a.username === user.username);
      setAttendances(my.reverse());
    })();

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const getLocation = async () => {
    try {
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
      setLocation(loc.coords);
      return loc.coords;
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível obter localização: ' + e.message);
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
    Alert.alert('Presença registrada', `Presença confirmada (${method}) em ${d.toLocaleString()}`);
  };

  const handleCheckIn = async () => {
    if (!permissionGranted) {
      Alert.alert('Permissão', 'Permita localização e tente novamente.');
      return;
    }
    const coords = await getLocation();
    if (!coords) return;
    const dist = distanceInMeters(coords.latitude, coords.longitude, SCHOOL_CONFIG.latitude, SCHOOL_CONFIG.longitude);
    if (dist <= SCHOOL_CONFIG.geofenceRadiusMeters) {
      await markAttendance(coords, 'geofence');
    } else {
      Alert.alert('Fora da escola', `Você está a ${Math.round(dist)} m da escola. Movimente-se para dentro do raio de ${SCHOOL_CONFIG.geofenceRadiusMeters} m ou registre manualmente.`,
        [ { text: 'Registrar manualmente', onPress: () => markAttendance(coords, 'manual') }, { text: 'Ok' } ]);
    }
  };

  const startAutoCheck = () => {
    if (!permissionGranted) {
      Alert.alert('Permissão', 'Permita localização e tente novamente.');
      setAutoCheckIn(false);
      return;
    }
    setAutoCheckIn(true);
    intervalRef.current = setInterval(async () => {
      const coords = await getLocation();
      if (!coords) return;
      const dist = distanceInMeters(coords.latitude, coords.longitude, SCHOOL_CONFIG.latitude, SCHOOL_CONFIG.longitude);
      if (dist <= SCHOOL_CONFIG.geofenceRadiusMeters) {
        const raw = await AsyncStorage.getItem(STORAGE_KEYS.ATTENDANCE);
        const list = raw ? JSON.parse(raw) : [];
        const last = list.filter(l => l.username === user.username).slice(-1)[0];
        const now = Date.now();
        if (!last || (now - new Date(last.timestamp).getTime()) > (30*60*1000)) {
          await markAttendance(coords, 'auto');
        }
      }
    }, 30 * 1000);
  };

  const stopAutoCheck = () => {
    setAutoCheckIn(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Bem-vindo, {user.name}</Text>
      <Text style={styles.subtitle}>Escola: {SCHOOL_CONFIG.name}</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Checar Presença</Text>
        <TouchableOpacity style={styles.button} onPress={handleCheckIn}>
          <Text style={styles.buttonText}>Registrar Presença (Checar Localização)</Text>
        </TouchableOpacity>
        <View style={{flexDirection:'row', alignItems:'center', marginTop:8}}>
          <Text style={{marginRight:8}}>Auto-presença</Text>
          <Switch value={autoCheckIn} onValueChange={v => v ? startAutoCheck() : stopAutoCheck()} />
        </View>
        <Text style={{marginTop:8, fontSize:12}}>Local permitido: {SCHOOL_CONFIG.geofenceRadiusMeters} m</Text>
      </View>

      <View style={[styles.card, {flex:1}]}>
        <Text style={styles.cardTitle}>Histórico de Presenças</Text>
        {attendances.length === 0 ? <Text style={styles.cardText}>Nenhuma presença registrada.</Text> : (
          <FlatList data={attendances} keyExtractor={(_,i)=>String(i)} renderItem={({item})=> (
            <View style={{paddingVertical:6}}>
              <Text style={{fontWeight:'600'}}>{item.name} — {new Date(item.timestamp).toLocaleString()}</Text>
              <Text style={{fontSize:12}}>Método: {item.method} • Lat: {item.latitude.toFixed(4)} • Lon: {item.longitude.toFixed(4)}</Text>
            </View>
          )} />
        )}
      </View>
    </SafeAreaView>
  );
}

// Admin screen
function AdminScreen({ navigation }) {
  const [attendance, setAttendance] = useState([]);

  useEffect(() => {
    const load = async () => {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.ATTENDANCE);
      const list = raw ? JSON.parse(raw) : [];
      setAttendance(list.reverse());
    };
    load();
    const focusListener = navigation.addListener && navigation.addListener('focus', load);
    return () => focusListener && focusListener();
  }, [navigation]);

  const clearAll = async () => {
    Alert.alert('Confirmar', 'Apagar todos os registros de presença?', [
      { text: 'Cancelar' },
      { text: 'Apagar', style: 'destructive', onPress: async () => { await AsyncStorage.removeItem(STORAGE_KEYS.ATTENDANCE); setAttendance([]); } }
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Painel da Secretaria</Text>
      <Text style={styles.subtitle}>Presenças registradas ({attendance.length})</Text>
      <View style={{flex:1, width:'100%', marginTop:12}}>
        <FlatList data={attendance} keyExtractor={(_,i)=>String(i)} renderItem={({item})=> (
          <View style={{padding:10, borderBottomWidth:1, borderBottomColor:'#eee'}}>
            <Text style={{fontWeight:'700'}}>{item.name} — {new Date(item.timestamp).toLocaleString()}</Text>
            <Text style={{fontSize:12}}>Usuário: {item.username} • Método: {item.method}</Text>
            <Text style={{fontSize:12}}>Lat: {item.latitude.toFixed(4)} • Lon: {item.longitude.toFixed(4)}</Text>
          </View>
        )} />
      </View>

      <TouchableOpacity style={[styles.button, {backgroundColor:'#c0392b', marginTop:12}]} onPress={clearAll}>
        <Text style={styles.buttonText}>Apagar todos os registros</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="About" component={AboutScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Student" component={StudentScreen} options={{ headerLeft: null }} />
        <Stack.Screen name="Admin" component={AdminScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, alignItems:'center', padding:16, backgroundColor:'#f9fbfd' },
  title: { fontSize:22, fontWeight:'700', marginVertical:12 },
  subtitle: { fontSize:14, color:'#333', marginBottom:12 },
  input: { width:'100%', padding:12, borderWidth:1, borderColor:'#ddd', borderRadius:8, marginBottom:10, backgroundColor:'#fff' },
  button: { backgroundColor:'#2a9df4', padding:12, borderRadius:8, width:'100%', alignItems:'center', marginTop:8 },
  buttonText: { color:'#fff', fontWeight:'700' },
  outline: { backgroundColor:'#fff', borderWidth:1, borderColor:'#2a9df4' },
  outlineText: { color:'#2a9df4' },
  card: { width:'100%', backgroundColor:'#fff', padding:12, borderRadius:8, marginBottom:12, shadowColor:'#000', shadowOpacity:0.03, elevation:2 },
  cardTitle: { fontWeight:'700', marginBottom:6 },
  cardText: { color:'#333' }
});
