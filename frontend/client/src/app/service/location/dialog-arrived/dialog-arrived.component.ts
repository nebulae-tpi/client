import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material';

@Component({
  selector: 'app-dialog-arrived',
  templateUrl: './dialog-arrived.component.html',
  styleUrls: ['./dialog-arrived.component.scss']
})
export class DialogArrivedComponent implements OnInit {
  constructor(public dialogRef: MatDialogRef<DialogArrivedComponent>) {}

  ngOnInit() {}

  close(): void {
    this.dialogRef.close();
  }
}
