import { Component, OnInit, OnDestroy } from '@angular/core';

@Component({
  selector: 'app-requested-progress',
  templateUrl: './requested-progress.component.html',
  styleUrls: ['./requested-progress.component.scss']
})
export class RequestedProgressComponent implements OnInit, OnDestroy {
  timeoutAlive = true;
  showCancelText = false;
  constructor() {}

  ngOnInit() {
    this.startTimeoutText();
  }

  ngOnDestroy(): void {
    this.timeoutAlive = false;
  }

  startTimeoutText() {
    setTimeout(() => {
      this.showCancelText = !this.showCancelText;
      if (this.timeoutAlive) {
        this.startTimeoutText();
      }
    }, 1500);
  }
}
