import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Howl } from 'howler';  // Import Howler
import { PunchRequest, PunchResponse } from '../../models/types';
import { firstValueFrom } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { AttendanceService } from '../../services/attendance.service';
import { Router, NavigationStart } from '@angular/router';
import { Subscription } from 'rxjs';

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
  private restartTimeout: any = null;
  private beepSound: Howl | null = null;
  private navigationSubscription: Subscription | null = null;
  private static hasReloaded = false;

  deviceInfoError: string | null = null;
  punchRequest!: PunchRequest;
  latitude: number | null = null;
  longitude: number | null = null;
  ip: string | null = null;

  private endpoint = 'https://api.ipify.org?format=json';

  scanStatusMessage: string = '';
  scanSuccessful: boolean = false;
  qrResult: string | null = null;
  cameras: MediaDeviceInfo[] = [];
  selectedDeviceId: string = '';
  scannerActive = false;
  errorMessage: string | null = null;
  isLoading = true;

  showDeviceInfoPopup = false;
  deviceInfoInput: string = '';

  constructor(@Inject(DOCUMENT) private document: Document, private http: HttpClient, private service: AttendanceService, private router: Router) {
    this.checkEnvironmentSupport();
    this.initializeBeepSound();
  }

  async ngOnInit(): Promise<void> {
   
    if (typeof window !== 'undefined') {
      const storedDeviceInfo = localStorage.getItem('deviceInfo');
      if (!storedDeviceInfo) {
        this.showDeviceInfoPopup = true;
        return;
      }
    }

    if (!this.isMediaDevicesSupported || !this.isSecureContext) {
      this.isLoading = false;
      return;
    }

    await this.initializeCamera();
    this.isLoading = false;

    this.ip = await this.getPublicIp();
    this.getLocation();
  }

  ngOnDestroy(): void {
    this.stopScanner();
  }

  canDeactivate(): boolean {
    const confirmLeave = window.confirm('Are you sure you want to leave this page? Scanning will stop.');
    if (confirmLeave) {
      this.stopScanner();  // Ensure camera is stopped
    }
    return confirmLeave;
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
        volume: 10
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

      setTimeout(() => this.startScanner(), 0);
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
    this.errorMessage = error instanceof Error ? error.message : 'Failed to access camera';
  }

  async startScanner(): Promise<void> {
    this.clearResult();
    clearTimeout(this.decodeTimeout);
    if (!this.selectedDeviceId || this.scannerActive) return;

    try {
      this.errorMessage = null;
      this.scannerActive = true;
      this.videoElement = this.document.getElementById('qr-video') as HTMLVideoElement;

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
              this.qrResult = result.getText();
              this.handleScanSuccess(this.qrResult);
            } else if (error && this.scannerActive) {
              if (
                error.message &&
                error.message.includes('No MultiFormat Readers were able to detect the code')
              ) {
                this.restartScannerAfterDelay();
              } else {
                this.handleScanError(error);
                this.restartScannerAfterDelay();
              }
            }
          }
        );
      }, 1500);
    } catch (error) {
      this.handleScanError(error);
    }
  }

  private handleScanSuccess(result: string) {
    const deviceId = localStorage.getItem('deviceInfo');
    if (result && deviceId) {
      this.punchRequest = {
        employeeId: JSON.parse(result)?.employeeId,
        deviceId: deviceId,
        latitude: this.latitude,
        longitude: this.longitude,
        ipAddress: this.ip
      }

      this.service.punch(this.punchRequest).subscribe((res: PunchResponse) => {
        this.qrResult = res.data.message;
        this.scanSuccessful = true;
        this.scanStatusMessage = 'Scan successful! ✓';

        if (this.beepSound) {
          this.beepSound.play();
        }

        this.restartScannerAfterDelay();
      });
    }
  }

  private restartScannerAfterDelay(delay: number = 10000) {
    if (!this.scannerActive) return;

    if (this.restartTimeout) {
      clearTimeout(this.restartTimeout);
    }

    this.restartTimeout = setTimeout(() => {
      if (this.scannerActive) {
        this.startScanner();
      }
    }, delay);
  }

  private handleScanError(error: unknown): void {
    this.scannerActive = false;
    this.errorMessage = error instanceof Error ? error.message : 'Scanning failed';
  }

  stopScanner(): void {
    this.scannerActive = false;

    if (this.decodeTimeout) {
      clearTimeout(this.decodeTimeout);
      this.decodeTimeout = null;
    }

    if (this.restartTimeout) {
      clearTimeout(this.restartTimeout);
      this.restartTimeout = null;
    }

    if (this.activeStream) {
      this.activeStream.getTracks().forEach(track => track.stop());
      this.activeStream = null;
    }

    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }

    console.log('Scanner stopped.');
  }

  async retryCameraSetup(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = null;
    await this.initializeCamera();
    this.isLoading = false;
  }

  clearResult(): void {
    this.scanStatusMessage = '';
    this.qrResult = null;
  }

  saveDeviceInfo(): void {
    if (!this.deviceInfoInput || !this.deviceInfoInput.trim()) {
      return;
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem('deviceInfo', this.deviceInfoInput.trim());
      alert('✅ Device information saved successfully!');
    }

    this.showDeviceInfoPopup = false;
    this.ngOnInit();
  }

  getLocation(): void {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.latitude = position.coords.latitude;
          this.longitude = position.coords.longitude;
          this.errorMessage = null;
        },
        (error) => {
          switch (error.code) {
            case error.PERMISSION_DENIED:
              this.errorMessage = 'User denied the request for Geolocation.';
              break;
            case error.POSITION_UNAVAILABLE:
              this.errorMessage = 'Location information is unavailable.';
              break;
            case error.TIMEOUT:
              this.errorMessage = 'The request to get user location timed out.';
              break;
            default:
              this.errorMessage = 'An unknown error occurred.';
              break;
          }
          this.latitude = null;
          this.longitude = null;
        }
      );
    } else {
      this.errorMessage = 'Geolocation is not supported by this browser.';
    }
  }

  async getPublicIp(): Promise<string> {
    const { ip } = await firstValueFrom(
      this.http.get<{ ip: string }>(this.endpoint)
    );
    return ip;
  }

}
