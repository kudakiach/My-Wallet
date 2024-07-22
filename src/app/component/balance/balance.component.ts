import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { FinancesService } from 'src/app/shared/finances.service';

@Component({
  selector: 'app-balance',
  templateUrl: './balance.component.html',
  styleUrls: ['./balance.component.css']
})
export class BalanceComponent implements OnInit, OnDestroy {
  totalEarnings: number = 0;
  totalPayments: number = 0;
  totalBalance: number = 0;

  private earningsSubscription: Subscription = new Subscription();
  private paymentsSubscription: Subscription = new Subscription();

  constructor(private financesService: FinancesService) {}

  ngOnInit() {
    this.earningsSubscription = this.financesService.totalEarnings$.subscribe(
      newTotalEarnings => {
        this.totalEarnings = newTotalEarnings;
        this.updateTotalBalance();
      }
    );

    this.paymentsSubscription = this.financesService.totalPayments$.subscribe(
      newTotalPayments => {
        this.totalPayments = newTotalPayments;
        this.updateTotalBalance();
      }
    );
  }

  updateTotalBalance(): void {
    this.totalBalance = this.totalEarnings - this.totalPayments;
  }

  ngOnDestroy() {
    this.earningsSubscription.unsubscribe();
    this.paymentsSubscription.unsubscribe();
  }
}