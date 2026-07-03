import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  Image,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as FileSystem from 'expo-file-system/legacy';
import { CheckDef } from '../data/checklists';
import { CheckState, CheckStatus } from '../types';
import { Colors, sizes, statusTextColors, useColors } from '../theme';
import { useReport } from '../store/useReport';

const STATUS_OPTIONS: Exclude<CheckStatus, null>[] = ['תקין', 'לא תקין', 'הערה'];

interface Props {
  check: CheckDef;
  checkKey: string;
  state: CheckState;
  imageUri?: string;
}

export const CheckRow: React.FC<Props> = ({ check, checkKey, state, imageUri }) => {
  const colors = useColors();
  const dark = useReport((s) => s.darkMode);
  const { setStatus, setNote, setValue, setCheckImagePath } = useReport();
  const [cameraOpen, setCameraOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const stColors = statusTextColors(dark);

  // ── שדה ערך (תאריך / שעות עבודה) ──
  if (check.kind === 'value') {
    return (
      <View style={styles.row}>
        <Text style={styles.description}>
          {check.description}
          {check.internal ? ' 🔒' : ''}
        </Text>
        {check.internal && (
          <Text style={styles.internalHint}>שדה פנימי — לא יופיע בדוח ללקוח</Text>
        )}
        <TextInput
          style={styles.noteInput}
          value={state.value}
          onChangeText={(t) => setValue(checkKey, t)}
          placeholder="הזן ערך..."
          placeholderTextColor={colors.textMuted}
          textAlign="right"
        />
      </View>
    );
  }

  // ── תת-בדיקה רגילה ──
  const openCamera = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('הרשאה נדרשת', 'יש לאפשר גישה למצלמה בהגדרות המכשיר.');
        return;
      }
    }
    setCameraOpen(true);
  };

  const capturePhoto = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      if (photo?.uri) {
        const dir = FileSystem.documentDirectory + 'photos/';
        await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
        const safeKey = checkKey.replace(/[^a-zA-Z0-9א-ת]/g, '_');
        const dest = dir + `check_${safeKey}_${Date.now()}.jpg`;
        await FileSystem.copyAsync({ from: photo.uri, to: dest });
        setCheckImagePath(checkKey, dest);
        setCameraOpen(false);
      }
    } catch {
      Alert.alert('שגיאה', 'לא ניתן לצלם תמונה. נסה שוב.');
    }
  };

  const noteVisible = state.status === 'לא תקין' || state.status === 'הערה';

  const buttonStyle = (opt: Exclude<CheckStatus, null>) => {
    if (state.status !== opt) return styles.statusBtn;
    if (opt === 'תקין') return [styles.statusBtn, { backgroundColor: colors.ok, borderColor: '#2ecc71' }];
    if (opt === 'לא תקין') return [styles.statusBtn, { backgroundColor: colors.fail, borderColor: '#e74c3c' }];
    return [styles.statusBtn, { backgroundColor: colors.noteBg, borderColor: '#F0B429' }];
  };

  const buttonTextStyle = (opt: Exclude<CheckStatus, null>) => {
    if (state.status !== opt) return styles.statusBtnText;
    const color = opt === 'תקין' ? stColors.ok : opt === 'לא תקין' ? stColors.fail : stColors.note;
    return [styles.statusBtnText, { color, fontWeight: 'bold' as const }];
  };

  return (
    <View style={[styles.row, state.status === 'לא תקין' && styles.rowFail]}>
      <View style={styles.topRow}>
        <Text style={styles.description}>{check.description}</Text>
        <TouchableOpacity
          onPress={imageUri ? () => setPreviewOpen(true) : openCamera}
          style={styles.cameraBtn}
        >
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.thumbnail} />
          ) : (
            <Text style={styles.cameraIcon}>📷</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.statusGroup}>
        {STATUS_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt}
            onPress={() => setStatus(checkKey, opt)}
            style={buttonStyle(opt)}
            activeOpacity={0.7}
          >
            <Text style={buttonTextStyle(opt)}>{opt}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {noteVisible && (
        <TextInput
          style={styles.noteInput}
          value={state.note}
          onChangeText={(t) => setNote(checkKey, t)}
          placeholder="הערה / פעולה שננקטה..."
          placeholderTextColor={colors.textMuted}
          textAlign="right"
          multiline
        />
      )}

      {/* מודאל מצלמה */}
      <Modal visible={cameraOpen} animationType="slide" statusBarTranslucent>
        <View style={styles.cameraContainer}>
          <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />
          <View style={styles.cameraOverlay}>
            <TouchableOpacity style={styles.closeCameraBtn} onPress={() => setCameraOpen(false)}>
              <Text style={styles.closeCameraBtnText}>✕ סגור</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.captureBtn} onPress={capturePhoto}>
              <View style={styles.captureBtnInner} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* תצוגת תמונה */}
      {imageUri && (
        <Modal visible={previewOpen} animationType="fade" statusBarTranslucent>
          <View style={styles.previewContainer}>
            <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="contain" />
            <View style={styles.previewActions}>
              <TouchableOpacity
                style={styles.retakeBtn}
                onPress={() => { setPreviewOpen(false); openCamera(); }}
              >
                <Text style={styles.retakeBtnText}>צלם מחדש</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.closePreviewBtn} onPress={() => setPreviewOpen(false)}>
                <Text style={styles.closePreviewBtnText}>סגור</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    row: {
      backgroundColor: colors.card,
      borderRadius: sizes.radiusSM,
      padding: sizes.spacingMD,
      marginBottom: sizes.spacingSM,
      borderWidth: 1,
      borderColor: colors.border,
    },
    rowFail: {
      borderColor: '#e74c3c',
      borderWidth: 1.5,
    },
    topRow: {
      flexDirection: 'row-reverse',
      alignItems: 'flex-start',
      marginBottom: sizes.spacingSM,
      gap: sizes.spacingSM,
    },
    description: {
      flex: 1,
      fontSize: sizes.fontSizeBody,
      color: colors.textBody,
      textAlign: 'right',
      fontWeight: '500',
    },
    internalHint: {
      fontSize: sizes.fontSizeSmall,
      color: colors.textMuted,
      textAlign: 'right',
      marginBottom: sizes.spacingXS,
    },
    cameraBtn: {
      width: 36,
      height: 36,
      borderRadius: sizes.radiusSM,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.inputBg,
      overflow: 'hidden',
    },
    cameraIcon: { fontSize: 18 },
    thumbnail: { width: 36, height: 36 },
    statusGroup: {
      flexDirection: 'row-reverse',
      gap: sizes.spacingXS,
    },
    statusBtn: {
      flex: 1,
      paddingVertical: 6,
      paddingHorizontal: 4,
      borderRadius: sizes.radiusSM,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      backgroundColor: colors.inputBg,
    },
    statusBtnText: {
      fontSize: sizes.fontSizeSmall,
      color: colors.textMuted,
      fontWeight: '500',
    },
    noteInput: {
      marginTop: sizes.spacingSM,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: sizes.radiusSM,
      padding: sizes.spacingSM,
      fontSize: sizes.fontSizeBody,
      color: colors.textBody,
      backgroundColor: colors.inputBg,
      minHeight: 40,
      textAlignVertical: 'top',
    },
    // מצלמה
    cameraContainer: { flex: 1, backgroundColor: 'black' },
    cameraOverlay: {
      ...StyleSheet.absoluteFillObject,
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: sizes.spacingLG,
      paddingTop: 48,
    },
    closeCameraBtn: {
      alignSelf: 'flex-end',
      backgroundColor: 'rgba(0,0,0,0.6)',
      paddingHorizontal: sizes.spacingMD,
      paddingVertical: sizes.spacingSM,
      borderRadius: sizes.radiusMD,
    },
    closeCameraBtnText: { color: 'white', fontSize: sizes.fontSizeBody, fontWeight: 'bold' },
    captureBtn: {
      alignSelf: 'center',
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: 'rgba(255,255,255,0.3)',
      borderWidth: 3,
      borderColor: 'white',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: sizes.spacingLG,
    },
    captureBtnInner: { width: 54, height: 54, borderRadius: 27, backgroundColor: 'white' },
    // תצוגת תמונה
    previewContainer: { flex: 1, backgroundColor: 'black', justifyContent: 'center' },
    previewImage: { flex: 1 },
    previewActions: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: sizes.spacingMD,
      padding: sizes.spacingMD,
      backgroundColor: 'black',
    },
    retakeBtn: {
      backgroundColor: '#4A4F6E',
      borderRadius: sizes.radiusSM,
      paddingVertical: sizes.spacingSM,
      paddingHorizontal: sizes.spacingLG,
    },
    retakeBtnText: { color: '#CEC28C', fontWeight: 'bold', fontSize: sizes.fontSizeBody },
    closePreviewBtn: {
      borderWidth: 1,
      borderColor: 'white',
      borderRadius: sizes.radiusSM,
      paddingVertical: sizes.spacingSM,
      paddingHorizontal: sizes.spacingLG,
    },
    closePreviewBtnText: { color: 'white', fontSize: sizes.fontSizeBody },
  });
