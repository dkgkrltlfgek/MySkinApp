import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export default function App() {
  // 상태 변수: 선택된 이미지, 예측 결과, 로딩 상태, 오류 메시지
  const [selectedImage, setSelectedImage] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [predictionError, setPredictionError] = useState(null);

  // NOTE: 여기에 FastAPI 서버의 실제 주소를 입력하세요.
  // 예: 'http://192.168.0.10:8000' 또는 'https://your-server-domain.com'
  const SERVER_URL = 'http://192.168.0.17:8000/upload';

  // 갤러리에서 이미지를 선택하는 함수
  const pickImage = async () => {
    // 갤러리 접근 권한 요청
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        '권한 거부',
        '이미지를 선택하려면 갤러리 접근 권한이 필요합니다.',
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0]);
      setPrediction(null);
      setPredictionError(null);
    }
  };

  // 선택된 이미지를 서버에 업로드하고 예측 결과를 받는 함수
  const uploadImage = async () => {
    if (!selectedImage) {
      Alert.alert('오류', '먼저 이미지를 선택하세요.');
      return;
    }

    setLoading(true);
    setPredictionError(null);

    const uri = selectedImage.uri;
    const uriParts = uri.split('.');
    const fileType = uriParts[uriParts.length - 1];

    // FormData를 사용하여 이미지 파일 전송
    const formData = new FormData();
    formData.append('file', {
      uri,
      name: `photo.${fileType}`,
      type: `image/${fileType}`,
    });

    try {
      // 서버로 POST 요청 전송
      const response = await fetch(SERVER_URL, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!response.ok) {
        throw new Error(`서버 오류: ${response.status}`);
      }

      // 서버로부터 JSON 응답 받기
      const result = await response.json();
      setPrediction(result);
      if (result.error) {
        setPredictionError(result.error);
      }
    } catch (error) {
      console.error('업로드 오류:', error);
      setPredictionError('이미지 업로드에 실패했습니다. 서버 상태를 확인하세요.');
    } finally {
      setLoading(false);
    }
  };

  // 앱 화면 UI
  return (
    <View style={styles.container}>
      <Text style={styles.title}>피부 질환 분류기</Text>

      {/* 이미지가 선택되면 화면에 표시 */}
      {selectedImage && (
        <Image source={{ uri: selectedImage.uri }} style={styles.image} />
      )}

      {/* 로딩 중일 때 로딩 인디케이터 표시 */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#333" />
          <Text style={styles.loadingText}>분석 중...</Text>
        </View>
      )}

      {/* 예측 오류 메시지 표시 */}
      {predictionError && (
        <Text style={styles.errorText}>{predictionError}</Text>
      )}

      {/* 예측 결과 표시 */}
      {prediction && !predictionError && (
        <View style={styles.predictionContainer}>
          <Text style={styles.predictionTitle}>예측 결과</Text>
          <Text style={styles.predictionText}>
            질환: {prediction.class || '알 수 없음'}
          </Text>
          <Text style={styles.predictionText}>
            정확도: {(prediction.confidence * 100).toFixed(2)}%
          </Text>
        </View>
      )}

      {/* 버튼들 */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={pickImage}>
          <Text style={styles.buttonText}>이미지 선택</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={uploadImage}>
          <Text style={styles.buttonText}>분석 시작</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 30,
    fontFamily: 'sans-serif-light',
  },
  image: {
    width: 250,
    height: 250,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#ccc',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  button: {
    backgroundColor: '#6c63ff',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: 15,
    borderRadius: 10,
  },
  loadingText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#555',
  },
  predictionContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 15,
    marginBottom: 30,
    width: '90%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  predictionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  predictionText: {
    fontSize: 16,
    color: '#555',
    lineHeight: 24,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
});
