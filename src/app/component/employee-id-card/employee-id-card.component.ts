import { Component, Input, ViewChild, ElementRef, OnInit } from '@angular/core';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { QrService } from '../../services/qr.service';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { IdCardService } from '../../services/id-card.service';

@Component({
  selector: 'app-employee-id-card',
  templateUrl: './employee-id-card.component.html',
  imports:[CommonModule],
  styleUrls: ['./employee-id-card.component.css']
})
export class EmployeeIdCardComponent implements OnInit {
  @Input() employee = {
    id: '',
    firstname: '',
    lastname: '',
    employeePhotoUrl: '../../../assets/img/upload_profile.png'
  };

  @ViewChild('frontCard', { static: false }) frontCardRef!: ElementRef;
  @ViewChild('backCard', { static: false }) backCardRef!: ElementRef;

  qrData = '';
  employeePhotoUrl: string = ''; // Base64 or uploaded image URL

  onPhotoSelected(event: Event): void {
    const fileInput = event.target as HTMLInputElement;
    const file = fileInput.files?.[0];

    if (file && this.employee?.id) {
      this.idCardService.uploadProfilePicture(this.employee.id, file).subscribe({
        next: (res) => {
          // Update local photo preview
          const reader = new FileReader();
          reader.onload = () => {
            this.employeePhotoUrl = reader.result as string;
          };
          reader.readAsDataURL(file);
        },
        error: (err) => {
          console.error('Error uploading photo:', err);
        },
      });
    }
  }


  constructor(private qrService: QrService, private route: ActivatedRoute, private idCardService: IdCardService) {}

  async ngOnInit(): Promise<void> {
    this.qrData = await this.qrService.generateQRCode(this.employee.id);
      this.route.paramMap.subscribe(params => {
        this.employee.id = params.get('employeeId') || '';
        this.employee.firstname = decodeURIComponent(params.get('firstName') || '');
        this.employee.lastname = decodeURIComponent(params.get('lastName') || '');
      });
    
      if (this.employee?.id) {
        this.idCardService.getProfileImage(this.employee.id).subscribe({
          next: (response) => {
            if (response.status === 200 && response.body?.data?.data?.profileImageUrl) {
              const imageUrl = response.body.data.data.profileImageUrl;
              this.employeePhotoUrl = `${imageUrl}?t=${new Date().getTime()}`;

            }
          },
          error: (err) => {
            if (err.status === 404) {
              this.employeePhotoUrl = '../../../assets/img/upload_profile.png';
            } else {
              console.error('Failed to fetch image', err);
            }
          },
        });
      }
    }

  downloadBothAsPdf(): void {
    const frontCard = document.querySelectorAll('.id-card')[0] as HTMLElement;
    const backCard = document.querySelectorAll('.id-card')[1] as HTMLElement;
  
    if (!frontCard || !backCard) {
      console.error('ID cards not found');
      return;
    }
  
    Promise.all([
      html2canvas(frontCard, { backgroundColor: null, scale: 3 }),
      html2canvas(backCard, { backgroundColor: null, scale: 3 })
    ]).then(([frontCanvas, backCanvas]) => {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [frontCanvas.width, frontCanvas.height * 2] // stack vertically
      });
  
      pdf.addImage(frontCanvas.toDataURL('image/png'), 'PNG', 0, 0, frontCanvas.width, frontCanvas.height);
      pdf.addImage(backCanvas.toDataURL('image/png'), 'PNG', 0, frontCanvas.height, backCanvas.width, backCanvas.height);
  
      pdf.save('Employee-ID-Card.pdf');
    }).catch(error => {
      console.error('Failed to generate PDF:', error);
    });
  }
}
