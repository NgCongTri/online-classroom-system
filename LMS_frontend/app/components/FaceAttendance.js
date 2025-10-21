'use client';

import { useState, useRef, useEffect } from 'react';

export default function FaceAttendance({ sessionId, onSuccess, onError }) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const captureIntervalRef = useRef(null);

  // Khởi động webcam
  const startWebcam = async () => {
    try {
      setError('');
      setStatus('Đang khởi động camera...');
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setStatus('Camera đã sẵn sàng. Nhấn "Bắt đầu điểm danh" để tiếp tục.');
      }
    } catch (err) {
      console.error('Webcam error:', err);
      setError('Không thể truy cập camera. Vui lòng kiểm tra quyền truy cập.');
    }
  };

  // Dừng webcam
  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (captureIntervalRef.current) {
      clearInterval(captureIntervalRef.current);
      captureIntervalRef.current = null;
    }
    setIsCapturing(false);
    setStatus('');
  };

  // Chuyển video frame sang base64
  const captureFrame = () => {
    if (!videoRef.current) return null;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0);
    
    // Chuyển sang base64 (chỉ lấy data, bỏ prefix "data:image/jpeg;base64,")
    const base64Image = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
    return base64Image;
  };

  // Gọi Face Recognition API
  const recognizeFace = async (base64Image) => {
    try {
      const response = await fetch('http://localhost:5000/api/recognize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: base64Image,
          session_id: sessionId,
          threshold: 0.30
        })
      });

      const data = await response.json();
      return data;
    } catch (err) {
      console.error('Face recognition API error:', err);
      return { success: false, error: 'Không thể kết nối tới Face Recognition Service' };
    }
  };

  // Gọi Backend để điểm danh
  const markAttendance = async (userId, confidence, distance) => {
    try {
      const token = localStorage.getItem('access_token');
      
      const response = await fetch('http://localhost:8000/api/attendances/mark-with-face/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          session_id: sessionId,
          user_id: userId,
          confidence: confidence,
          distance: distance
        })
      });

      const data = await response.json();
      return data;
    } catch (err) {
      console.error('Mark attendance error:', err);
      return { success: false, error: 'Không thể kết nối tới Backend' };
    }
  };

  // Quy trình điểm danh tự động
  const startAttendanceProcess = async () => {
    if (!streamRef.current) {
      setError('Vui lòng khởi động camera trước');
      return;
    }

    setIsCapturing(true);
    setStatus('Đang quét khuôn mặt...');
    setError('');

    let attemptCount = 0;
    const maxAttempts = 20; // Thử 20 lần (khoảng 40 giây)

    captureIntervalRef.current = setInterval(async () => {
      attemptCount++;

      // Capture frame từ video
      const frame = captureFrame();
      if (!frame) {
        setStatus(`Đang chụp... (${attemptCount}/${maxAttempts})`);
        return;
      }

      setStatus(`Đang nhận diện khuôn mặt... (${attemptCount}/${maxAttempts})`);

      // Gọi Face Recognition API
      const recognitionResult = await recognizeFace(frame);
      console.log('🔍 Flask API Response:', recognitionResult);

      if (recognitionResult.success && recognitionResult.recognized) {
        console.log('✅ Face recognized:', recognitionResult.user_id, 'Confidence:', recognitionResult.confidence);
        console.log('✅ Face recognized:', recognitionResult.user_id, 'Confidence:', recognitionResult.confidence);
        // Kiểm tra liveness
        if (!recognitionResult.is_real) {
          console.log('❌ Fake face detected! is_real:', recognitionResult.is_real);
          setError('⚠️ Phát hiện ảnh giả! Vui lòng sử dụng khuôn mặt thật.');
          setIsCapturing(false);
          clearInterval(captureIntervalRef.current);
          if (onError) onError('Fake face detected');
          return;
        }

        console.log('✅ Liveness check passed! Calling backend...');
        // Nhận diện thành công -> Gọi backend để điểm danh
        setStatus(`✅ Nhận diện: ${recognitionResult.user_id} (${recognitionResult.confidence.toFixed(1)}%)`);

        const attendanceResult = await markAttendance(
          recognitionResult.user_id,
          recognitionResult.confidence,
          recognitionResult.distance
        );

        console.log('📤 Django API Response:', attendanceResult);

        if (attendanceResult.success) {
          setStatus(`✅ Điểm danh thành công!`);
          setIsCapturing(false);
          clearInterval(captureIntervalRef.current);
          
          // Callback thành công
          if (onSuccess) {
            onSuccess({
              user: attendanceResult.user,
              joined_time: attendanceResult.joined_time,
              confidence: recognitionResult.confidence
            });
          }

          // Tự động tắt webcam sau 3 giây
          setTimeout(() => {
            stopWebcam();
          }, 3000);
        } else {
          // Backend lỗi
          setError(`❌ ${attendanceResult.error || 'Không thể điểm danh'}`);
          setIsCapturing(false);
          clearInterval(captureIntervalRef.current);
          if (onError) onError(attendanceResult.error);
        }

      } else if (attemptCount >= maxAttempts) {
        // Hết số lần thử
        setError('❌ Không nhận diện được khuôn mặt sau 20 lần thử. Vui lòng thử lại.');
        setIsCapturing(false);
        clearInterval(captureIntervalRef.current);
        if (onError) onError('Max attempts reached');
      } else {
        // Chưa nhận diện được, tiếp tục thử
        setStatus(`Đang tìm khuôn mặt... (${attemptCount}/${maxAttempts})`);
      }

    }, 2000); // Thử mỗi 2 giây
  };

  // Cleanup khi component unmount
  useEffect(() => {
    return () => {
      stopWebcam();
    };
  }, []);

  return (
    <div className="border rounded-lg p-6 bg-white shadow-sm">
      <h3 className="text-lg font-semibold mb-4">Điểm danh bằng Khuôn mặt</h3>

      {/* Video preview */}
      <div className="mb-4">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full max-w-md mx-auto rounded-lg border-2 border-gray-300"
          style={{ transform: 'scaleX(-1)' }} // Mirror effect
        />
      </div>

      {/* Status messages */}
      {status && (
        <div className="mb-4 p-3 bg-blue-50 text-blue-700 rounded-lg text-center">
          {status}
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-center">
          {error}
        </div>
      )}

      {/* Controls */}
      <div className="flex gap-2 justify-center">
        {!streamRef.current && (
          <button
            onClick={startWebcam}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Khởi động Camera
          </button>
        )}

        {streamRef.current && !isCapturing && (
          <>
            <button
              onClick={startAttendanceProcess}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Bắt đầu Điểm danh
            </button>
            <button
              onClick={stopWebcam}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Tắt Camera
            </button>
          </>
        )}

        {isCapturing && (
          <button
            onClick={() => {
              setIsCapturing(false);
              clearInterval(captureIntervalRef.current);
              setStatus('Đã dừng quét');
            }}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Dừng lại
          </button>
        )}
      </div>

      {/* Instructions */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
        <p className="font-semibold mb-2">Hướng dẫn:</p>
        <ol className="list-decimal list-inside space-y-1">
          <li>Nhấn "Khởi động Camera" và cho phép truy cập webcam</li>
          <li>Đảm bảo khuôn mặt của bạn nằm trong khung hình</li>
          <li>Nhấn "Bắt đầu Điểm danh" để hệ thống tự động nhận diện</li>
          <li>Giữ khuôn mặt thật (không dùng ảnh trên điện thoại)</li>
        </ol>
      </div>
    </div>
  );
}
