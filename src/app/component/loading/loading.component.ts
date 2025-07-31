import { Component } from '@angular/core';
import { LoadingService } from '../../services/loading.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-loading',
  templateUrl: './loading.component.html',
  imports:[CommonModule,FormsModule],
  styleUrls: ['./loading.component.css']
})
export class LoadingComponent {
  constructor(public loadingService: LoadingService) {}
}
