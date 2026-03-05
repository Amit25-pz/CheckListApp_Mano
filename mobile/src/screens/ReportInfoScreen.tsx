import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
} from 'react-native';
import { useReport } from '../store/useReport';
import { theme } from '../theme';
import { LogoHeader } from '../components/LogoHeader';

const HOSPITALS = [
  'בית חולים איכילוב',
  'בית חולים הדסה',
  'בית חולים רמב"ם',
  'בית חולים שיבא (תל השומר)',
  'בית חולים סורוקה',
  'אחר...',
];

const MACHINE_IDS = [
  'HBC-001',
  'HBC-002',
  'HBC-003',
  'HBC-004',
  'אחר...',
];

// ─── Generic picker modal ────────────────────────────────────────────────────

interface PickerFieldProps {
  label: string;
  selectedValue: string;
  options: string[];
  onSelect: (value: string) => void;
}

const PickerField: React.FC<PickerFieldProps> = ({
  label,
  selectedValue,
  options,
  onSelect,
}) => {
  const [visible, setVisible] = useState(false);
  const displayValue = selectedValue || `בחר ${label}...`;

  return (
    <>
      <TouchableOpacity
        style={styles.pickerBtn}
        onPress={() => setVisible(true)}
        activeOpacity={0.75}
      >
        <Text style={[styles.pickerBtnText, !selectedValue && styles.placeholder]}>
          {displayValue}
        </Text>
        <Text style={styles.chevron}>▼</Text>
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setVisible(false)}
        >
          <View style={styles.pickerModal}>
            <Text style={styles.pickerModalTitle}>{label}</Text>
            <FlatList
              data={options}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.pickerOption,
                    item === selectedValue && styles.pickerOptionActive,
                  ]}
                  onPress={() => {
                    onSelect(item);
                    setVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.pickerOptionText,
                      item === selectedValue && styles.pickerOptionTextActive,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

// ─── Screen ──────────────────────────────────────────────────────────────────

export const ReportInfoScreen: React.FC = () => {
  const { technician, hospital, machineId, updateMeta, completeSetup, isSetupComplete } = useReport();

  // Local picker state
  const knownHospitals = HOSPITALS.slice(0, -1);
  const knownMachines = MACHINE_IDS.slice(0, -1);

  const [hospitalPick, setHospitalPick] = useState<string>(() =>
    knownHospitals.includes(hospital) ? hospital : hospital ? 'אחר...' : ''
  );
  const [hospitalCustom, setHospitalCustom] = useState<string>(() =>
    knownHospitals.includes(hospital) ? '' : hospital
  );

  const [machinePick, setMachinePick] = useState<string>(() =>
    knownMachines.includes(machineId) ? machineId : machineId ? 'אחר...' : ''
  );
  const [machineCustom, setMachineCustom] = useState<string>(() =>
    knownMachines.includes(machineId) ? '' : machineId
  );

  // Sync derived values back to the store
  useEffect(() => {
    const eff = hospitalPick === 'אחר...' ? hospitalCustom : hospitalPick;
    updateMeta({ hospital: eff });
  }, [hospitalPick, hospitalCustom]);

  useEffect(() => {
    const eff = machinePick === 'אחר...' ? machineCustom : machinePick;
    updateMeta({ machineId: eff });
  }, [machinePick, machineCustom]);

  const effectiveHospital = hospitalPick === 'אחר...' ? hospitalCustom : hospitalPick;
  const effectiveMachine = machinePick === 'אחר...' ? machineCustom : machinePick;
  const canStart = technician.trim() !== '' && effectiveHospital.trim() !== '' && effectiveMachine.trim() !== '';

  // Only show Setup-mode "Start" button when not yet set up
  const isSetupMode = !isSetupComplete;

  const handleStart = () => {
    completeSetup();
    // Navigation happens automatically via RootNavigator re-render
  };

  return (
    <View style={styles.wrapper}>
      <LogoHeader subtitle={isSetupMode ? 'הגדרת דוח חדש' : undefined} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {!isSetupMode && (
          <>
            <Text style={styles.pageTitle}>פרטי הדוח</Text>
            <Text style={styles.pageSubtitle}>מלא את הפרטים לפני ייצוא הדוח</Text>
          </>
        )}

        {/* Technician */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>שם הטכנאי</Text>
          <TextInput
            style={styles.textInput}
            value={technician}
            onChangeText={(t) => updateMeta({ technician: t })}
            placeholder="הזן שם טכנאי"
            placeholderTextColor="#999"
            textAlign="right"
          />
        </View>

        {/* Hospital */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>בית חולים</Text>
          <PickerField
            label="בית חולים"
            selectedValue={hospitalPick}
            options={HOSPITALS}
            onSelect={setHospitalPick}
          />
          {hospitalPick === 'אחר...' && (
            <TextInput
              style={[styles.textInput, styles.customInput]}
              value={hospitalCustom}
              onChangeText={setHospitalCustom}
              placeholder="הזן שם בית חולים"
              placeholderTextColor="#999"
              textAlign="right"
            />
          )}
        </View>

        {/* Machine ID */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>מזהה מכשיר</Text>
          <PickerField
            label="מזהה מכשיר"
            selectedValue={machinePick}
            options={MACHINE_IDS}
            onSelect={setMachinePick}
          />
          {machinePick === 'אחר...' && (
            <TextInput
              style={[styles.textInput, styles.customInput]}
              value={machineCustom}
              onChangeText={setMachineCustom}
              placeholder="הזן מזהה מכשיר"
              placeholderTextColor="#999"
              textAlign="right"
            />
          )}
        </View>

        {/* Summary card — show in edit mode only */}
        {!isSetupMode && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>סיכום פרטים</Text>
            <SummaryRow label="טכנאי" value={technician} />
            <SummaryRow label="בית חולים" value={effectiveHospital} />
            <SummaryRow label="מזהה מכשיר" value={effectiveMachine} />
          </View>
        )}

        {/* Start button — shown in setup mode only */}
        {isSetupMode && (
          <TouchableOpacity
            style={[styles.startBtn, !canStart && styles.startBtnDisabled]}
            onPress={handleStart}
            disabled={!canStart}
            activeOpacity={0.8}
          >
            <Text style={[styles.startBtnText, !canStart && styles.startBtnTextDisabled]}>
              התחל בדיקה ←
            </Text>
          </TouchableOpacity>
        )}

        {isSetupMode && !canStart && (
          <Text style={styles.hintText}>יש למלא את כל השדות כדי להמשיך</Text>
        )}
      </ScrollView>
    </View>
  );
};

const SummaryRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={styles.summaryRow}>
    <Text style={styles.summaryLabel}>{label}:</Text>
    <Text style={styles.summaryValue}>{value || '—'}</Text>
  </View>
);

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: theme.lightBg,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: theme.spacingMD,
    paddingBottom: theme.spacingXL,
  },
  pageTitle: {
    fontSize: theme.fontSizeXL,
    fontWeight: 'bold',
    color: theme.primary,
    textAlign: 'right',
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: theme.fontSizeBody,
    color: '#666',
    textAlign: 'right',
    marginBottom: theme.spacingMD,
  },
  fieldGroup: {
    marginBottom: theme.spacingMD,
  },
  label: {
    fontSize: theme.fontSizeBody,
    fontWeight: '600',
    color: theme.primary,
    textAlign: 'right',
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: theme.white,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: theme.radiusSM,
    padding: theme.spacingSM,
    fontSize: theme.fontSizeBody,
    color: theme.textBody,
    height: 48,
  },
  customInput: {
    marginTop: theme.spacingXS,
  },
  // Picker
  pickerBtn: {
    backgroundColor: theme.white,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: theme.radiusSM,
    height: 48,
    paddingHorizontal: theme.spacingMD,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerBtnText: {
    fontSize: theme.fontSizeBody,
    color: theme.textBody,
    flex: 1,
    textAlign: 'right',
  },
  placeholder: {
    color: '#999',
  },
  chevron: {
    color: theme.border,
    fontSize: theme.fontSizeSmall,
    marginStart: theme.spacingXS,
  },
  // Picker modal
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: theme.spacingMD,
  },
  pickerModal: {
    backgroundColor: theme.white,
    borderRadius: theme.radiusMD,
    overflow: 'hidden',
    maxHeight: 320,
  },
  pickerModalTitle: {
    fontSize: theme.fontSizeMedium,
    fontWeight: 'bold',
    color: theme.primary,
    textAlign: 'right',
    padding: theme.spacingMD,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  pickerOption: {
    padding: theme.spacingMD,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  pickerOptionActive: {
    backgroundColor: theme.lightBg,
  },
  pickerOptionText: {
    fontSize: theme.fontSizeBody,
    color: theme.textBody,
    textAlign: 'right',
  },
  pickerOptionTextActive: {
    color: theme.primary,
    fontWeight: 'bold',
  },
  // Summary card
  summaryCard: {
    backgroundColor: theme.white,
    borderRadius: theme.radiusMD,
    padding: theme.spacingMD,
    borderWidth: 1,
    borderColor: theme.border,
    marginTop: theme.spacingMD,
  },
  summaryTitle: {
    fontSize: theme.fontSizeMedium,
    fontWeight: 'bold',
    color: theme.primary,
    textAlign: 'right',
    marginBottom: theme.spacingSM,
  },
  summaryRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  summaryLabel: {
    fontSize: theme.fontSizeBody,
    color: '#666',
    textAlign: 'right',
  },
  summaryValue: {
    fontSize: theme.fontSizeBody,
    color: theme.textBody,
    fontWeight: '500',
    textAlign: 'left',
  },
  // Start button
  startBtn: {
    backgroundColor: theme.primary,
    borderRadius: theme.radiusMD,
    padding: theme.spacingMD,
    alignItems: 'center',
    marginTop: theme.spacingMD,
    minHeight: 52,
    justifyContent: 'center',
  },
  startBtnDisabled: {
    opacity: 0.4,
  },
  startBtnText: {
    color: theme.accent,
    fontSize: theme.fontSizeMedium,
    fontWeight: 'bold',
  },
  startBtnTextDisabled: {
    color: theme.textDark,
  },
  hintText: {
    fontSize: theme.fontSizeSmall,
    color: '#888',
    textAlign: 'center',
    marginTop: theme.spacingSM,
  },
});
