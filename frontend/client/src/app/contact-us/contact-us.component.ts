import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material';
import { ServiceService } from '../service/service.service';

@Component({
  selector: 'app-contact-us',
  templateUrl: './contact-us.component.html',
  styleUrls: ['./contact-us.component.scss']
})
export class ContactUsComponent implements OnInit {
  businessContactInfo = {
    phone: 3108942249,
    whatsapp: 573108942249
  };
  constructor(
    public dialogRef: MatDialogRef<ContactUsComponent>,
    private serviceService: ServiceService
  ) {}

  ngOnInit() {
    if (this.serviceService.businessContactInfo) {
      this.businessContactInfo = this.serviceService.businessContactInfo;
    }
  }

  close(): void {
    this.dialogRef.close();
  }
}
