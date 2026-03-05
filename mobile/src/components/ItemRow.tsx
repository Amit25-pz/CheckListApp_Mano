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
import { ChecklistItem, Status } from '../types';
import { theme } from '../theme';

type UiChoice = 'תקין' | 'לא תקין' | 'הערה';
const UI_OPTIONS: UiChoice[] = ['תקין', 'לא תקין', 'הערה'];

interface Props {
  item: ChecklistItem;
  onUpdate: (id: number, patch: Partial<Pick<ChecklistItem, 'status' | 'note'>>) => void;
  imageUri?: string;
  onSetImage: (uri: string) => void;
}

export const ItemRow: React.FC<Props> = ({ item, onUpdate, imageUri, onSetImage }) => {
  const [noteVisible, setNoteVisible] = useState(
    item.status === 'לא תקין' || item.note !== ''
  );
  const [cameraOpen, setCameraOpen] = useState(false);
  const [photoPreviewVisible, setPhotoPreviewVisible] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  // null status → no button highlighted
  const activeButton: UiChoice | null =
    item.status === null
      ? null
      : item.status === 'לא תקין'
      ? 'לא תקין'
      : noteVisible
      ? 'הערה'
      : 'תקין';

  const handleChoice = (choice: UiChoice) => {
    if (choice === 'תקין') {
      setNoteVisible(false);
      onUpdate(item.id, { status: 'תקין', note: '' });
    } else if (choice === 'לא תקין') {
      setNoteVisible(true);
      onUpdate(item.id, { status: 'לא תקין' });
    } else {
      // 'הערה' — keeps status = תקין, opens note field
      setNoteVisible(true);
      onUpdate(item.id, { status: 'תקין' });
    }
  };

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
        const dest = dir + `item_${item.id}_${Date.now()}.jpg`;
        await FileSystem.copyAsync({ from: photo.uri, to: dest });
        onSetImage(dest);
        setCameraOpen(false);
      }
    } catch {
      Alert.alert('שגיאה', 'לא ניתן לצלם תמונה. נסה שוב.');
    }
  };

  return (
    <View style={[styles.row, item.status === 'לא תקין' && styles.rowFail]}>
      {/* Description + camera icon row */}
      <View style={styles.topRow}>
        <Text style={styles.description}>
          {item.id}. {item.description}
        </Text>
        <TouchableOpacity onPress={imageUri ? () => setPhotoPreviewVisible(true) : openCamera} style={styles.cameraBtn}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.thumbnail} />
          ) : (
            <Text style={styles.cameraIcon}>📷</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.radioGroup}>
        {UI_OPTIONS.map((opt) => {
          const isActive = activeButton === opt;
          return (
            <TouchableOpacity
              key={opt}
              onPress={() => handleChoice(opt)}
              style={[
                styles.radioBtn,
                isActive && (opt === 'לא תקין' ? styles.radioBtnFail : styles.radioBtnOk),
              ]}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.radioBtnText,
                  isActive && styles.radioBtnTextActive,
                ]}
              >
                {opt}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {noteVisible && (
        <TextInput
          style={styles.noteInput}
          value={item.note}
          onChangeText={(text) => onUpdate(item.id, { note: text })}
          placeholder="הזן הערה..."
          placeholderTextColor="#999"
          textAlign="right"
          multiline
        />
      )}

      {/* Camera modal */}
      <Modal visible={cameraOpen} animationType="slide" statusBarTranslucent>
        <View style={styles.cameraContainer}>
          <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />
          <View style={styles.cameraOverlay}>
            <TouchableOpacity
              style={styles.closeCameraBtn}
              onPress={() => setCameraOpen(false)}
            >
              <Text style={styles.closeCameraBtnText}>✕ סגור</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.captureBtn} onPress={capturePhoto}>
              <View style={styles.captureBtnInner} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Photo preview modal */}
      {imageUri && (
        <Modal visible={photoPreviewVisible} animationType="fade" statusBarTranslucent>
          <View style={styles.previewContainer}>
            <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="contain" />
            <View style={styles.previewActions}>
              <TouchableOpacity
                style={styles.retakeBtn}
                onPress={() => { setPhotoPreviewVisible(false); openCamera(); }}
              >
                <Text style={styles.retakeBtnText}>צלם מחדש</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.closePreviewBtn}
                onPress={() => setPhotoPreviewVisible(false)}
              >
                <Text style={styles.closePreviewBtnText}>סגור</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    backgroundColor: theme.white,
    borderRadius: theme.radiusSM,
    padding: theme.spacingMD,
    marginBottom: theme.spacingSM,
    borderWidth: 1,
    borderColor: theme.border,
  },
  rowFail: {
    borderColor: '#e74c3c',
    borderWidth: 1.5,
    backgroundColor: '#fff8f8',
  },
  topRow: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    marginBottom: theme.spacingSM,
    gap: theme.spacingSM,
  },
  description: {
    flex: 1,
    fontSize: theme.fontSizeBody,
    color: theme.textBody,
    textAlign: 'right',
    fontWeight: '500',
  },
  cameraBtn: {
    width: 36,
    height: 36,
    borderRadius: theme.radiusSM,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    overflow: 'hidden',
  },
  cameraIcon: {
    fontSize: 18,
  },
  thumbnail: {
    width: 36,
    height: 36,
  },
  radioGroup: {
    flexDirection: 'row-reverse',
    gap: theme.spacingXS,
  },
  radioBtn: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: theme.radiusSM,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  radioBtnOk: {
    backgroundColor: theme.ok,
    borderColor: '#2ecc71',
  },
  radioBtnFail: {
    backgroundColor: theme.fail,
    borderColor: '#e74c3c',
  },
  radioBtnText: {
    fontSize: theme.fontSizeSmall,
    color: '#555',
    fontWeight: '500',
  },
  radioBtnTextActive: {
    color: theme.textBody,
    fontWeight: 'bold',
  },
  noteInput: {
    marginTop: theme.spacingSM,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: theme.radiusSM,
    padding: theme.spacingSM,
    fontSize: theme.fontSizeBody,
    color: theme.textBody,
    backgroundColor: '#fafafa',
    minHeight: 40,
    textAlignVertical: 'top',
  },
  // Camera modal
  cameraContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  cameraView: {
    flex: 1,
  },
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'column',
    justifyContent: 'space-between',
    padding: theme.spacingLG,
    paddingTop: 48,
  },
  closeCameraBtn: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: theme.spacingMD,
    paddingVertical: theme.spacingSM,
    borderRadius: theme.radiusMD,
  },
  closeCameraBtnText: {
    color: 'white',
    fontSize: theme.fontSizeBody,
    fontWeight: 'bold',
  },
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
    marginBottom: theme.spacingLG,
  },
  captureBtnInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'white',
  },
  // Photo preview
  previewContainer: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
  },
  previewImage: {
    flex: 1,
  },
  previewActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.spacingMD,
    padding: theme.spacingMD,
    backgroundColor: 'black',
  },
  retakeBtn: {
    backgroundColor: theme.primary,
    borderRadius: theme.radiusSM,
    paddingVertical: theme.spacingSM,
    paddingHorizontal: theme.spacingLG,
  },
  retakeBtnText: {
    color: theme.accent,
    fontWeight: 'bold',
    fontSize: theme.fontSizeBody,
  },
  closePreviewBtn: {
    borderWidth: 1,
    borderColor: 'white',
    borderRadius: theme.radiusSM,
    paddingVertical: theme.spacingSM,
    paddingHorizontal: theme.spacingLG,
  },
  closePreviewBtnText: {
    color: 'white',
    fontSize: theme.fontSizeBody,
  },
});
