import React, { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { Camera, X, Upload, CheckCircle, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';
import { storageService } from '../services/storage';
import { MemberPhoto } from './MemberPhoto';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (token: string) => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasCamera, setHasCamera] = useState<boolean>(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'camera' | 'upload' | 'test'>('camera');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Available sample students for instant 1-click test verification
  const sampleMembers = storageService.getMembers().slice(0, 5);

  const extractTokenFromData = (data: string): string => {
    if (!data) return '';
    const raw = data.trim();

    // Check for /verify/:token, #verify/:token, /student/:token, or #student/:token
    const patterns = ['/verify/', '#verify/', '/student/', '#student/'];
    for (const pat of patterns) {
      if (raw.includes(pat)) {
        const after = raw.split(pat)[1];
        if (after) {
          const tokenPart = after.split('/')[0].split('?')[0].split('#')[0].trim();
          if (tokenPart) {
            return decodeURIComponent(tokenPart);
          }
        }
      }
    }

    // Direct token or URL-encoded string
    const sanitized = raw.split('?')[0].split('#')[0].trim();
    return decodeURIComponent(sanitized);
  };

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setHasCamera(false);
        setCameraError('Camera access is not supported on this browser/environment.');
        setActiveTab('test');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        scanVideoFrame();
      }
    } catch (err: unknown) {
      console.warn('Camera access denied or failed:', err);
      setHasCamera(false);
      setCameraError('Camera permission was not granted or no webcam was detected.');
    }
  };

  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const scanVideoFrame = () => {
    if (!videoRef.current || videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) {
      animationFrameRef.current = requestAnimationFrame(scanVideoFrame);
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert',
    });

    if (code && code.data) {
      const token = extractTokenFromData(code.data);
      if (token) {
        stopCamera();
        onScanSuccess(token);
        onClose();
        return;
      }
    }

    animationFrameRef.current = requestAnimationFrame(scanVideoFrame);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setIsProcessing(false);
          return;
        }
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        setIsProcessing(false);
        if (code && code.data) {
          const token = extractTokenFromData(code.data);
          onScanSuccess(token);
          onClose();
        } else {
          alert('Could not read a valid QR code from this image. Please try a clearer picture.');
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (isOpen && activeTab === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200">
        {/* Modal Header */}
        <div className="bg-[#0f2942] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-amber-400" />
            <h3 className="font-semibold text-base sm:text-lg">
              Scan Student Verification QR Code
            </h3>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('camera')}
            className={`flex-1 py-3 text-center border-b-2 transition-colors ${
              activeTab === 'camera'
                ? 'border-[#0f2942] text-[#0f2942] bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Camera Scanner
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-3 text-center border-b-2 transition-colors ${
              activeTab === 'upload'
                ? 'border-[#0f2942] text-[#0f2942] bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Upload QR Image
          </button>
          <button
            onClick={() => setActiveTab('test')}
            className={`flex-1 py-3 text-center border-b-2 transition-colors ${
              activeTab === 'test'
                ? 'border-[#0f2942] text-[#0f2942] bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Instant Test Demo
          </button>
        </div>

        {/* Tab 1: Live Camera Scanner */}
        {activeTab === 'camera' && (
          <div className="p-6 text-center">
            {cameraError ? (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-left mb-4">
                <div className="flex gap-2 text-amber-800 font-semibold text-sm mb-1">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  Camera Preview Unavailable
                </div>
                <p className="text-xs text-amber-700 mb-3">
                  {cameraError}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveTab('upload')}
                    className="text-xs px-3 py-1.5 bg-amber-600 text-white rounded-md font-medium"
                  >
                    Upload QR Image
                  </button>
                  <button
                    onClick={() => setActiveTab('test')}
                    className="text-xs px-3 py-1.5 bg-white border border-amber-300 text-amber-900 rounded-md font-medium"
                  >
                    Use Instant Test
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="relative w-full aspect-square max-w-[280px] mx-auto rounded-2xl overflow-hidden bg-black border-4 border-[#0f2942]/40 shadow-inner flex items-center justify-center">
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    autoPlay
                    muted
                    playsInline
                  />
                  <canvas ref={canvasRef} className="hidden" />

                  {/* Aiming Reticle */}
                  <div className="absolute inset-8 border-2 border-amber-400/80 rounded-xl pointer-events-none flex flex-col justify-between p-2">
                    <div className="flex justify-between">
                      <div className="w-5 h-5 border-t-4 border-l-4 border-amber-400" />
                      <div className="w-5 h-5 border-t-4 border-r-4 border-amber-400" />
                    </div>
                    <div className="h-0.5 bg-amber-400/70 shadow-xs animate-pulse" />
                    <div className="flex justify-between">
                      <div className="w-5 h-5 border-b-4 border-l-4 border-amber-400" />
                      <div className="w-5 h-5 border-b-4 border-r-4 border-amber-400" />
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-500 mt-4">
                  Hold the official UHV ID Card QR code inside the frame to verify.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Upload QR Image */}
        {activeTab === 'upload' && (
          <div className="p-6 text-center">
            <label className="border-2 border-dashed border-slate-300 hover:border-[#0f2942] rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-50 hover:bg-slate-100/60 block">
              <Upload className="w-10 h-10 text-slate-400 mb-2" />
              <span className="text-sm font-semibold text-slate-800">
                {isProcessing ? 'Analyzing Image...' : 'Click to Upload or Drag QR Photo'}
              </span>
              <span className="text-xs text-slate-500 mt-1">
                PNG, JPG, WEBP formats supported
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
                disabled={isProcessing}
              />
            </label>

            {isProcessing && (
              <div className="flex items-center justify-center gap-2 mt-4 text-xs font-medium text-slate-600">
                <RefreshCw className="w-4 h-4 animate-spin text-[#0f2942]" />
                Decoding QR code matrix...
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Instant Test Demo */}
        {activeTab === 'test' && (
          <div className="p-6">
            <div className="flex items-center gap-2 mb-3 text-xs font-semibold text-slate-700">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Simulate Scanning a Registered UHV Member:
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {sampleMembers.map((member) => (
                <button
                  key={member.qrToken}
                  onClick={() => {
                    stopCamera();
                    onScanSuccess(member.qrToken);
                    onClose();
                  }}
                  className="w-full p-2.5 rounded-xl border border-slate-200 hover:border-[#0f2942] hover:bg-slate-50 text-left flex items-center justify-between transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <MemberPhoto
                      photoUrl={member.photoUrl}
                      name={member.name}
                      size="xs"
                      shape="circle"
                      className="border border-slate-200"
                    />
                    <div>
                      <div className="text-sm font-semibold text-slate-900 group-hover:text-[#0f2942]">
                        {member.name}
                      </div>
                      <div className="text-xs text-slate-500">
                        {member.department} • <span className="font-medium text-amber-700">{member.role}</span>
                      </div>
                    </div>
                  </div>

                  <span className="text-xs px-2.5 py-1 bg-slate-100 group-hover:bg-[#0f2942] group-hover:text-white rounded-md font-medium transition-colors">
                    Test Scan
                  </span>
                </button>
              ))}

              {/* Invalid QR test option */}
              <button
                onClick={() => {
                  stopCamera();
                  onScanSuccess('invalid-token-test-123456');
                  onClose();
                }}
                className="w-full p-2.5 rounded-xl border border-dashed border-rose-200 bg-rose-50/50 hover:bg-rose-50 text-left flex items-center justify-between transition-all"
              >
                <div>
                  <div className="text-sm font-semibold text-rose-800">
                    Test Invalid / Unregistered QR Code
                  </div>
                  <div className="text-xs text-rose-600">
                    Demonstrates the "Member Not Found" security protocol
                  </div>
                </div>
                <span className="text-xs px-2.5 py-1 bg-rose-100 text-rose-800 rounded-md font-medium">
                  Test Invalid
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Footer info */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Zero-ID Protocol: Only cryptographic token lookup</span>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="font-medium text-slate-700 hover:text-slate-900"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
