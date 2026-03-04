import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, StatusBar, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { courierApi } from '../../api/courierApi';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';

type VehicleType = 'MOTORCYCLE' | 'BICYCLE' | 'WALKING' | 'CAR';

const VEHICLES: { value: VehicleType; label: string; icon: string }[] = [
  { value: 'MOTORCYCLE', label: 'Moto', icon: 'bicycle' },
  { value: 'BICYCLE', label: 'Bicicleta', icon: 'bicycle-outline' },
  { value: 'WALKING', label: 'A pie', icon: 'walk-outline' },
  { value: 'CAR', label: 'Carro', icon: 'car-outline' },
];

export const CourierProfileScreen = ({ navigation }: any) => {
  const { refreshProfile } = useAuth();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [vehicleType, setVehicleType] = useState<VehicleType>('MOTORCYCLE');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const needsPlate = vehicleType === 'MOTORCYCLE' || vehicleType === 'CAR';

  const validate = () => {
    const e: Record<string, string> = {};
    if (!firstName.trim()) e.firstName = 'El nombre es obligatorio';
    if (!lastName.trim()) e.lastName = 'El apellido es obligatorio';
    if (!documentNumber.trim()) e.documentNumber = 'El número de documento es obligatorio';
    else if (!/^\d{7,10}$/.test(documentNumber.trim())) e.documentNumber = 'Debe tener 7-10 dígitos';
    if (!phone.trim()) e.phone = 'El teléfono es obligatorio';
    if (!email.trim()) e.email = 'El email es obligatorio';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Email inválido';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await courierApi.create({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        documentNumber: documentNumber.trim(),
        phone: phone.trim(),
        email: email.trim().toLowerCase(),
        vehicleType,
        vehiclePlate: needsPlate ? vehiclePlate.trim().toUpperCase() : undefined,
        vehicleModel: vehicleModel.trim() || undefined,
      });
      await refreshProfile();
      Alert.alert(
        '¡Perfil creado!',
        'Tu perfil está en revisión. Sube tus documentos para completar la verificación.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error ?? 'No se pudo crear el perfil.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.courierSection} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mi perfil de domiciliario</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.infoBox}>
          <Ionicons name="shield-checkmark-outline" size={18} color={Colors.courierSection} />
          <Text style={styles.infoText}>
            Después de guardar, sube tu cédula, selfie y certificado de antecedentes.
            Tu cuenta será activada en menos de 24 horas.
          </Text>
        </View>

        {/* Datos personales */}
        <Text style={styles.sectionLabel}>Datos personales</Text>
        <Input label="Nombre" placeholder="Carlos"
          leftIcon="person-outline" value={firstName} onChangeText={setFirstName}
          error={errors.firstName} autoCapitalize="words" />
        <Input label="Apellido" placeholder="López"
          leftIcon="person-outline" value={lastName} onChangeText={setLastName}
          error={errors.lastName} autoCapitalize="words" />
        <Input label="Número de cédula" placeholder="1234567890"
          leftIcon="card-outline" value={documentNumber} onChangeText={setDocumentNumber}
          error={errors.documentNumber} keyboardType="numeric" />
        <Input label="Teléfono" placeholder="3001234567"
          leftIcon="call-outline" value={phone} onChangeText={setPhone}
          error={errors.phone} keyboardType="phone-pad" />
        <Input label="Email" placeholder="correo@ejemplo.com"
          leftIcon="mail-outline" value={email} onChangeText={setEmail}
          error={errors.email} keyboardType="email-address" autoCapitalize="none" />

        {/* Tipo de vehículo */}
        <Text style={styles.sectionLabel}>Tipo de vehículo</Text>
        <View style={styles.vehicleRow}>
          {VEHICLES.map(v => (
            <TouchableOpacity
              key={v.value}
              style={[styles.vehicleBtn, vehicleType === v.value && styles.vehicleBtnActive]}
              onPress={() => setVehicleType(v.value)}
            >
              <Ionicons
                name={v.icon as any} size={26}
                color={vehicleType === v.value ? Colors.white : Colors.courierSection}
              />
              <Text style={[styles.vehicleBtnText, vehicleType === v.value && { color: Colors.white }]}>
                {v.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Datos del vehículo (solo si aplica) */}
        {needsPlate && (
          <>
            <Input label="Placa" placeholder="ABC123"
              leftIcon="key-outline" value={vehiclePlate}
              onChangeText={(t) => setVehiclePlate(t.toUpperCase())}
              autoCapitalize="characters" />
            <Input label="Modelo del vehículo (opcional)" placeholder="Honda CB 2022"
              leftIcon="construct-outline" value={vehicleModel} onChangeText={setVehicleModel} />
          </>
        )}

        <Button
          title="Guardar perfil"
          fullWidth size="lg" loading={loading} onPress={handleSave}
          style={{ backgroundColor: Colors.courierSection, marginTop: 8 }}
          icon={<Ionicons name="save-outline" size={20} color={Colors.white} />}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.courierSection },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, gap: 12,
  },
  headerTitle: { ...Typography.h4, color: Colors.white },
  scroll: { flex: 1, backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  content: { padding: 24, paddingBottom: 40 },
  infoBox: {
    flexDirection: 'row', gap: 10, alignItems: 'flex-start',
    backgroundColor: Colors.courierSection + '10',
    borderRadius: 12, padding: 14, marginBottom: 24,
    borderWidth: 1, borderColor: Colors.courierSection + '30',
  },
  infoText: { ...Typography.caption, color: Colors.courierSection, flex: 1, lineHeight: 18 },
  sectionLabel: {
    ...Typography.subtitle1, color: Colors.textPrimary,
    marginBottom: 12, marginTop: 4,
  },
  vehicleRow: { flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  vehicleBtn: {
    flex: 1, minWidth: 70,
    alignItems: 'center', gap: 6, paddingVertical: 12, paddingHorizontal: 8,
    borderRadius: 14, borderWidth: 2, borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  vehicleBtnActive: { backgroundColor: Colors.courierSection, borderColor: Colors.courierSection },
  vehicleBtnText: { ...Typography.caption, color: Colors.textSecondary, fontWeight: '600' },
});
