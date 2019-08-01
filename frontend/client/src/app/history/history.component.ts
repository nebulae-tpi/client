import { Component, OnInit } from '@angular/core';
import { HistoryService } from './history.service';

@Component({
  selector: 'app-history',
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.scss']
})
export class HistoryComponent implements OnInit {

  constructor(private historyService: HistoryService) { }

  ngOnInit() {

    setTimeout(() => {
      this.historyService.getHistoryServices$(2019, 7, 0, 10)
        .subscribe(r => {
          console.log('xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx ====> ', r);
        });
    }, 2000);

  }

}
