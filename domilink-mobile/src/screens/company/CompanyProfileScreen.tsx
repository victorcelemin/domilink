import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, StatusBar, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { companyApi } from '../../api/companyApi';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';

export const CompanyProfileScreen = ({ navigation }: any) => {
  const { refreshProfile } = useAuth();

  const [name, setName] = useState('');
  const [nit, setNit] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'El nombre es obligatorio';
    if (!nit.trim()) e.nit = 'El NIT es obligatorio';
    else if (!/^\d{9,10}-?\d?$/.test(nit.trim())) e.nit = 'Formato NIT inválido (ej: 9001234560)';
    if (!email.trim()) e.email = 'El email es obligatorio';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Email inválido';
    if (!address.trim()) e.address = 'La dirección es obligatoria';
    if (!city.trim()) e.city = 'La ciudad es obligatoria';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await companyApi.create({
        name: name.trim(),
        nit: nit.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        address: address.trim(),
        city: city.trim(),
        latitude: 4.6097,   // Coordenadas por defecto (Bogotá)
        longitude: -74.0817,
        description: description.trim(),
      });
      await refreshProfile();
      Alert.alert(
        '¡Empresa registrada!',
        'Tu empresa está en revisión. Un administrador la aprobará pronto.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error ?? 'No se pudo crear el perfil de empresa.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.companySection} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Perfil de empresa</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={18} color={Colors.primary} />
          <Text style={styles.infoText}>
            Completa el perfil de tu empresa para poder publicar pedidos.
            Un administrador revisará tu información.
          </Text>
        </View>

        <Input label="Nombre de la empresa" placeholder="Tienda Ejemplo SAS"
          leftIcon="business-outline" value={name} onChangeText={setName} error={errors.name} autoCapitalize="words" />
        <Input label="NIT" placeholder="9001234560"
          leftIcon="card-outline" value={nit} onChangeText={setNit} error={errors.nit} keyboardType="numeric" />
        <Input label="Email de contacto" placeholder="contacto@empresa.com"
          leftIcon="mail-outline" value={email} onChangeText={setEmail} error={errors.email}
          keyboardType="email-address" autoCapitalize="none" />
        <Input label="Teléfono" placeholder="3001234567"
          leftIcon="call-outline" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <Input label="Dirección" placeholder="Calle 10 # 20-30"
          leftIcon="location-outline" value={address} onChangeText={setAddress} error={errors.address} />
        <Input label="Ciudad" placeholder="Bogotá"
          leftIcon="map-outline" value={city} onChangeText={setCity} error={errors.city} autoCapitalize="words" />
        <Input label="Descripción (opcional)" placeholder="¿Qué vende tu empresa?"
          leftIcon="document-text-outline" value={description} onChangeText={setDescription} multiline />

        <Button
          title="Guardar empresa"
          fullWidth size="lg" loading={loading} onPress={handleSave}
          style={{ backgroundColor: Colors.companySection, marginTop: 8 }}
          icon={<Ionicons name="save-outline" size={20} color={Colors.white} />}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.companySection },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, gap: 12,
  },
  headerTitle: { ...Typography.h4, color: Colors.white },
  scroll: { flex: 1, backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  content: { padding: 24, paddingBottom: 40 },
  infoBox: {
    flexDirection: 'row', gap: 10, alignItems: 'flex-start',
    backgroundColor: Colors.infoLight, borderRadius: 12,
    padding: 14, marginBottom: 24, borderWidth: 1, borderColor: Colors.info + '30',
  },
  infoText: { ...Typography.caption, color: Colors.info, flex: 1, lineHeight: 18 },
});
