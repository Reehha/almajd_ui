
import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Howl } from 'howler';  // Import Howler

@Component({
  selector: 'app-qr-scanner',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './qr-scanner.component.html',
  styleUrls: ['./qr-scanner.component.css']
})
export class QrScannerComponent implements OnInit, OnDestroy {
  private codeReader = new BrowserMultiFormatReader();
  private videoElement: HTMLVideoElement | null = null;
  private activeStream: MediaStream | null = null;
  private decodeTimeout: any = null;
  private beepSound: Howl | null = null;
  scanStatusMessage: string = '';
scanSuccessful: boolean = false;
  
  // Scanner state
  qrResult: string | null = null;
  cameras: MediaDeviceInfo[] = [];
  selectedDeviceId: string = '';
  scannerActive = false;
  errorMessage: string | null = null;
  isLoading = true;

  constructor(@Inject(DOCUMENT) private document: Document) {
    this.checkEnvironmentSupport();
    this.initializeBeepSound();
  }

  async ngOnInit(): Promise<void> {
    if (!this.isMediaDevicesSupported || !this.isSecureContext) {
      this.isLoading = false;
      return;
    }
    await this.initializeCamera();
    this.isLoading = false;
  }

  ngOnDestroy(): void {
    this.stopScanner();
  }

  get isMediaDevicesSupported(): boolean {
    return !!this.document.defaultView?.navigator.mediaDevices;
  }

  get isSecureContext(): boolean {
    return this.document.defaultView?.isSecureContext ?? false;
  }

  get currentProtocol(): string {
    return this.document.defaultView?.location.protocol ?? 'unknown';
  }

  private checkEnvironmentSupport(): void {
    if (!this.isMediaDevicesSupported) {
      this.errorMessage = 'Camera access not supported in this browser. Try Chrome or Firefox.';
    } else if (!this.isSecureContext) {
      this.errorMessage = `Camera access requires HTTPS or localhost. Current protocol: ${this.currentProtocol}`;
    }
  }

  private initializeBeepSound(): void {
    try {
      this.beepSound = new Howl({
        src: ['assets/audio/beep-04.mp3'],
        preload: true,
        volume: 10  // Adjust volume as needed
      });
    } catch (e) {
      console.warn('Could not initialize beep sound:', e);
    }
  }

  private async initializeCamera(): Promise<void> {
    try {
      await this.requestCameraPermission();
      this.cameras = await BrowserMultiFormatReader.listVideoInputDevices();
      
      if (this.cameras.length === 0) {
        this.errorMessage = 'No cameras detected on this device.';
        return;
      }
      
      this.selectedDeviceId = this.cameras[0].deviceId;
    } catch (error) {
      this.handleCameraError(error);
    }
  }

  private async requestCameraPermission(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      throw new Error('Camera permission denied');
    }
  }

  private handleCameraError(error: unknown): void {
    console.error('Camera initialization error:', error);
    this.errorMessage = error instanceof Error 
      ? error.message 
      : 'Failed to access camera';
  }

  async startScanner(): Promise<void> {
    clearTimeout(this.decodeTimeout);
    if (!this.selectedDeviceId || this.scannerActive) return;

    try {
      this.errorMessage = null;
      this.scannerActive = true;
      this.videoElement = this.document.getElementById('qr-video') as HTMLVideoElement;
      
      // Get the media stream
      this.activeStream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: this.selectedDeviceId }
      });
      this.videoElement.srcObject = this.activeStream;

      this.decodeTimeout = setTimeout(() => {
        if (!this.videoElement || !this.scannerActive) {
          return;
        }
      
        this.codeReader.decodeFromVideoElement(
          this.videoElement,
          (result, error) => {
            if (!this.scannerActive) return;
      
            if (result) {
              // QR code detected; process result without stopping the feed
              this.qrResult = result.getText();
              this.handleScanSuccess(this.qrResult);
              
            } else if (error && this.scannerActive) {
              // Filter out the "No MultiFormat Readers" error:
              if (
                error.message &&
                error.message.includes('No MultiFormat Readers were able to detect the code')
              ) {
                // This error means no code was found; just restart scanning after a delay.
                this.restartScannerAfterDelay();
              } else {
                // Handle other errors normally.
                this.handleScanError(error);
                this.restartScannerAfterDelay();
              }
            }
          }
        );
      }, 1500); // Small delay to ensure video is ready
    } catch (error) {
      this.handleScanError(error);
    }
  }

  private handleScanSuccess(result: string) {
    this.qrResult = result;
    this.scanSuccessful = true;
    this.scanStatusMessage = 'Scan successful! ✓';
  
    if (this.beepSound) {
      this.beepSound.play();
    }
  
    // Instead of stopping the scanner, we simply restart the scanning loop after a brief delay.
    this.restartScannerAfterDelay(2000); // Adjust delay as needed.
  }

  private restartScannerAfterDelay(delay: number = 1000) {
    if (!this.scannerActive) return;
    
    clearTimeout(this.decodeTimeout);
    this.decodeTimeout = setTimeout(() => {
      this.startScanner();
    }, delay);
  }

  private handleScanError(error: unknown): void {
    this.scannerActive = false;
    this.errorMessage = error instanceof Error
      ? error.message
      : 'Scanning failed';
  }

  stopScanner(): void {
    this.scannerActive = false;
    
    // Clear any pending decode
    if (this.decodeTimeout) {
      clearTimeout(this.decodeTimeout);
      this.decodeTimeout = null;
    }
    
    // Stop the video stream
    if (this.activeStream) {
      this.activeStream.getTracks().forEach(track => track.stop());
      this.activeStream = null;
    }
    
    // Clear video element
    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }
  }

  async retryCameraSetup(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = null;
    await this.initializeCamera();
    this.isLoading = false;
  }

  clearResult(): void {
    this.qrResult = null;
  }
}