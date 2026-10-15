import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  CameraView,
  useCameraPermissions,
} from 'expo-camera';

import { parseQRPayload } from '@/lib/qr';
import { registerAttendance } from '@/lib/attendance';

export default function ScanScreen() {
  const [permission, requestPermission] =
    useCameraPermissions();

  const [scanned, setScanned] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] =
    useState<'success' | 'error' | ''>('');

  useFocusEffect(
    useCallback(() => {
      setScanned(false);
      setProcessing(false);
      setMessage('');
      setMessageType('');
    }, [])
  );

  const handleBarcodeScanned = async ({
    data,
  }: {
    data: string;
  }) => {
    if (scanned || processing) return;

    setScanned(true);
    setProcessing(true);
    setMessage('');
    setMessageType('');

    try {
      const payload = parseQRPayload(data);

      if (!payload) {
        setMessage('This QR code is not valid.');
        setMessageType('error');
        return;
      }

      const { error } = await registerAttendance(payload.event);

      if (error) {
        setMessage(error.message);
        setMessageType('error');
        return;
      }

      setMessage('Attendance recorded successfully!');
      setMessageType('success');
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Something went wrong. Please try again.'
      );
      setMessageType('error');
    } finally {
      setProcessing(false);
    }
  };

  const scanAgain = () => {
    setScanned(false);
    setProcessing(false);
    setMessage('');
    setMessageType('');
  };

  if (!permission) {
    return (
      <View style={styles.centerScreen}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.permissionIcon}>
          <Text style={styles.permissionEmoji}>📷</Text>
        </View>
        <ActivityIndicator size="large" color="#0EA5E9" />
        <Text style={styles.permissionTitle}>
          Preparing Scanner
        </Text>
        <Text style={styles.permissionText}>
          Checking camera permission...
        </Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.centerScreen}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.permissionIcon}>
          <Text style={styles.permissionEmoji}>📷</Text>
        </View>

        <Text style={styles.permissionTitle}>
          Camera Access Needed
        </Text>

        <Text style={styles.permissionText}>
          Allow camera access to scan event QR codes
          and record your attendance.
        </Text>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={requestPermission}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryButtonText}>
            Allow Camera
          </Text>
          <Text style={styles.buttonArrow}>→</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerIcon}>
              <Text style={styles.headerIconText}>⌗</Text>
            </View>

            <View style={styles.headerBadge}>
              <View style={styles.onlineDot} />
              <Text style={styles.headerBadgeText}>
                QR CHECK-IN
              </Text>
            </View>
          </View>

          <Text style={styles.title}>Scan Event</Text>
          <Text style={styles.titleAccent}>QR Code</Text>

          <Text style={styles.subtitle}>
            Scan your event QR code to record your
            attendance quickly and securely.
          </Text>

          <View style={styles.infoCard}>
            <View style={styles.infoIcon}>
              <Text style={styles.infoEmoji}>📋</Text>
            </View>

            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>
                Attendance Scanner
              </Text>
              <Text style={styles.infoDescription}>
                Position the event QR code inside the frame.
              </Text>
            </View>
          </View>
        </View>

        {/* SCANNER SECTION */}
        <View style={styles.content}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>
                QR Scanner
              </Text>
              <Text style={styles.sectionSubtitle}>
                Camera is ready to scan
              </Text>
            </View>

            <View style={styles.cameraBadge}>
              <View style={styles.cameraDot} />
              <Text style={styles.cameraBadgeText}>
                LIVE
              </Text>
            </View>
          </View>

          {/* CAMERA WINDOW */}
          <View style={styles.cameraCard}>
            <View style={styles.cameraHeader}>
              <View>
                <Text style={styles.cameraTitle}>
                  Scan your code
                </Text>
                <Text style={styles.cameraSubtitle}>
                  Align the QR code within the corners
                </Text>
              </View>

              <View style={styles.cameraSmallIcon}>
                <Text style={styles.cameraEmoji}>📷</Text>
              </View>
            </View>

            <View style={styles.cameraViewport}>
              <CameraView
                style={StyleSheet.absoluteFillObject}
                facing="back"
                barcodeScannerSettings={{
                  barcodeTypes: ['qr'],
                }}
                onBarcodeScanned={
                  scanned ? undefined : handleBarcodeScanned
                }
              />

              {/* Blue scanner frame */}
              <View style={styles.scanFrame}>
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />

                {!scanned && !processing && (
                  <View style={styles.scanHint}>
                    <Text style={styles.scanHintText}>
                      Align QR code here
                    </Text>
                  </View>
                )}

                {processing && (
                  <View style={styles.resultOverlay}>
                    <View style={styles.processingCircle}>
                      <ActivityIndicator
                        size="large"
                        color="#FFFFFF"
                      />
                    </View>
                    <Text style={styles.overlayText}>
                      Verifying attendance...
                    </Text>
                  </View>
                )}

                {messageType === 'success' && !processing && (
                  <View style={styles.resultOverlay}>
                    <View style={styles.successCircle}>
                      <Text style={styles.resultIcon}>✓</Text>
                    </View>
                    <Text style={styles.overlayText}>
                      Scan successful
                    </Text>
                  </View>
                )}

                {messageType === 'error' && !processing && (
                  <View style={styles.resultOverlay}>
                    <View style={styles.errorCircle}>
                      <Text style={styles.resultIcon}>!</Text>
                    </View>
                    <Text style={styles.overlayText}>
                      Scan unsuccessful
                    </Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.cameraFooter}>
              <View style={styles.footerDot} />
              <Text style={styles.cameraFooterText}>
                Keep your QR code clearly visible
              </Text>
            </View>
          </View>

          {/* PROCESSING MESSAGE */}
          {processing && (
            <View style={styles.messageCard}>
              <ActivityIndicator
                size="small"
                color="#0284C7"
              />
              <Text style={styles.messageText}>
                Checking and recording your attendance...
              </Text>
            </View>
          )}

          {/* RESULT MESSAGE */}
          {message !== '' && !processing && (
            <View
              style={[
                styles.messageCard,
                messageType === 'success'
                  ? styles.successMessageCard
                  : styles.errorMessageCard,
              ]}
            >
              <View
                style={[
                  styles.messageIcon,
                  messageType === 'success'
                    ? styles.successMessageIcon
                    : styles.errorMessageIcon,
                ]}
              >
                <Text style={styles.messageIconText}>
                  {messageType === 'success' ? '✓' : '!'}
                </Text>
              </View>

              <View style={styles.messageContent}>
                <Text
                  style={[
                    styles.messageTitle,
                    messageType === 'success'
                      ? styles.successText
                      : styles.errorText,
                  ]}
                >
                  {messageType === 'success'
                    ? 'Attendance Recorded'
                    : 'Unable to Record'}
                </Text>

                <Text style={styles.messageText}>
                  {message}
                </Text>
              </View>
            </View>
          )}

          {/* SCAN AGAIN */}
          {scanned && !processing && (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={scanAgain}
              activeOpacity={0.8}
            >
              <Text style={styles.refreshIcon}>↻</Text>
              <Text style={styles.primaryButtonText}>
                Scan Again
              </Text>
            </TouchableOpacity>
          )}

          {/* INSTRUCTIONS */}
          {!message && !processing && (
            <View style={styles.tipsCard}>
              <View style={styles.tipsIcon}>
                <Text style={styles.tipsEmoji}>💡</Text>
              </View>

              <View style={styles.tipsContent}>
                <Text style={styles.tipsTitle}>
                  Scanning Tips
                </Text>
                <Text style={styles.tipsText}>
                  Keep your camera steady, ensure enough
                  lighting, and fit the entire QR code
                  inside the scanning frame.
                </Text>
              </View>
            </View>
          )}

          {/* SECURITY FOOTER */}
          <View style={styles.securityFooter}>
            <Text style={styles.securityIcon}>✓</Text>
            <Text style={styles.securityText}>
              Secure Attendance Check-in
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F9FF',
  },

  scrollContent: {
    flexGrow: 1,
    paddingBottom: 25,
  },

  centerScreen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },

  permissionIcon: {
    width: 88,
    height: 88,
    borderRadius: 28,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 22,
  },

  permissionEmoji: {
    fontSize: 40,
  },

  permissionTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
    marginTop: 20,
  },

  permissionText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 25,
  },

  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 22,
    paddingHorizontal: 24,
    paddingBottom: 25,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#E0F2FE',
  },

  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 25,
  },

  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
  },

  headerIconText: {
    color: '#0284C7',
    fontSize: 32,
    fontWeight: '800',
  },

  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },

  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#0EA5E9',
    marginRight: 7,
  },

  headerBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0369A1',
    letterSpacing: 1,
  },

  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.8,
  },

  titleAccent: {
    fontSize: 32,
    fontWeight: '900',
    color: '#0EA5E9',
    letterSpacing: -0.8,
    marginTop: -2,
  },

  subtitle: {
    color: '#64748B',
    fontSize: 14,
    lineHeight: 22,
    marginTop: 10,
  },

  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#D7EEFF',
    borderRadius: 18,
    padding: 15,
    marginTop: 22,
  },

  infoIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  infoEmoji: {
    fontSize: 22,
  },

  infoContent: {
    flex: 1,
    marginLeft: 13,
  },

  infoTitle: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800',
  },

  infoDescription: {
    color: '#64748B',
    fontSize: 11,
    lineHeight: 17,
    marginTop: 4,
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 26,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 17,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
  },

  sectionSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 5,
  },

  cameraBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    borderRadius: 20,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },

  cameraDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#16A34A',
    marginRight: 6,
  },

  cameraBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#166534',
    letterSpacing: 0.5,
  },

  cameraCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 23,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0F2FE',
    shadowColor: '#0F172A',
    shadowOpacity: 0.045,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 2,
  },

  cameraHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },

  cameraTitle: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '800',
  },

  cameraSubtitle: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 5,
  },

  cameraSmallIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },

  cameraEmoji: {
    fontSize: 20,
  },

  cameraViewport: {
    height: 300,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },

  scanFrame: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },

  corner: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderColor: '#38BDF8',
    borderWidth: 4,
  },

  topLeft: {
    top: 16,
    left: 16,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 12,
  },

  topRight: {
    top: 16,
    right: 16,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 12,
  },

  bottomLeft: {
    bottom: 16,
    left: 16,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 12,
  },

  bottomRight: {
    bottom: 16,
    right: 16,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 12,
  },

  scanHint: {
    backgroundColor: 'rgba(15,23,42,0.72)',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
  },

  scanHintText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  resultOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,23,42,0.66)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  processingCircle: {
    width: 68,
    height: 68,
    borderRadius: 24,
    backgroundColor: '#0284C7',
    justifyContent: 'center',
    alignItems: 'center',
  },

  successCircle: {
    width: 68,
    height: 68,
    borderRadius: 24,
    backgroundColor: '#16A34A',
    justifyContent: 'center',
    alignItems: 'center',
  },

  errorCircle: {
    width: 68,
    height: 68,
    borderRadius: 24,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
  },

  resultIcon: {
    color: '#FFFFFF',
    fontSize: 38,
    fontWeight: '900',
  },

  overlayText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 14,
    textAlign: 'center',
  },

  cameraFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
  },

  footerDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#0EA5E9',
    marginRight: 8,
  },

  cameraFooterText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },

  messageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    borderColor: '#BAE6FD',
    borderWidth: 1,
    borderRadius: 17,
    padding: 15,
    marginTop: 16,
  },

  successMessageCard: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },

  errorMessageCard: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },

  messageIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  successMessageIcon: {
    backgroundColor: '#16A34A',
  },

  errorMessageIcon: {
    backgroundColor: '#DC2626',
  },

  messageIconText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
  },

  messageContent: {
    flex: 1,
  },

  messageTitle: {
    color: '#0369A1',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 4,
  },

  messageText: {
    color: '#475569',
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
  },

  successText: {
    color: '#166534',
  },

  errorText: {
    color: '#B91C1C',
  },

  primaryButton: {
    backgroundColor: '#0284C7',
    borderRadius: 15,
    paddingHorizontal: 22,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    shadowColor: '#0284C7',
    shadowOpacity: 0.16,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 3,
  },

  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },

  buttonArrow: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    marginLeft: 12,
  },

  refreshIcon: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    marginRight: 9,
  },

  tipsCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 19,
    borderWidth: 1,
    borderColor: '#E0F2FE',
    padding: 16,
    marginTop: 18,
  },

  tipsIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
  },

  tipsEmoji: {
    fontSize: 20,
  },

  tipsContent: {
    flex: 1,
    marginLeft: 12,
  },

  tipsTitle: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '800',
  },

  tipsText: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 19,
    marginTop: 5,
  },

  securityFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 10,
  },

  securityIcon: {
    color: '#0284C7',
    fontSize: 13,
    fontWeight: '900',
    marginRight: 7,
  },

  securityText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
});