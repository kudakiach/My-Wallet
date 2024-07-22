import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/shared/auth.service';
import { Router } from '@angular/router';
import Chart from 'chart.js/auto';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { EarningTableEntry } from 'src/app/model/earning-table-entry';
import { PayingTableEntry } from 'src/app/model/paying-table-entry';
import { DataService } from 'src/app/shared/data.service';

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css']
})
export class ReportsComponent implements OnInit {

  chart?: Chart;
  reportType: string = '0';
  year: string = '2023';
  yearMonth: string = '2023-01';

  userID:string | null = null;

  earnings: Array<EarningTableEntry> = new Array();
  spendings: Array<EarningTableEntry> = new Array();
  
  constructor(
    private auth: AuthService, 
    private router : Router, 
    private firestore : AngularFirestore,
    private dataService: DataService) { }

  ngOnInit(): void {
    if (!this.auth.checkUserLogin()) {
      this.router.navigate(['login']);
    }

    this.userID = this.auth.getUserId();
      
    this.firestore.collection('newEarningMoney', ref => ref.where('userID', '==', this.userID))
      .snapshotChanges()
      .subscribe(actions => {
        this.earnings = actions.map(a => {
          const data = a.payload.doc.data() as EarningTableEntry;
          const earningId = a.payload.doc.id;
          return { earningId, ...data };
        });
    
    });

    this.firestore.collection('newPayingMoney', ref => ref.where('userID', '==', this.userID))
      .snapshotChanges()
      .subscribe(actions => {
        this.spendings = actions.map(a => {
          const data = a.payload.doc.data() as PayingTableEntry;
          const payingId = a.payload.doc.id;
          return { payingId, ...data };
        });
      
    });
    

    if (this.chart) {
      this.chart.destroy();
    }

    

    this.chart = this.createAnnualChart();
  }

  onYearChange(): void {
    if (this.chart) {
      this.chart.destroy();
    }
    this.chart = this.createAnnualChart();
  }

  onYearMonthChange(): void {
    var date = new Date(this.yearMonth);
    console.log(this.yearMonth + " is " + date);
    if (this.chart) {
      this.chart.destroy();
    }
    this.chart = this.createMonthlyChart();  
}

  onReportTypeChange(): void {
    console.log("report type = " + this.reportType);
    if (this.reportType == '0') {
      var element = document.getElementById('inputYearMonth');
      if (element) {
        element.className = 'chart-input-invisible';
      }
      element = document.getElementById('inputYear');
      if (element) {
        element.className = 'chart-input-visible';
      }
      if (this.chart) {
        this.chart.destroy();
      }
      this.chart = this.createAnnualChart();  
    } else {
      var element = document.getElementById('inputYearMonth');
      if (element) {
        element.className = 'chart-input-visible';
      }
      element = document.getElementById('inputYear');
      if (element) {
        element.className = 'chart-input-invisible';
      }
      if (this.chart) {
        this.chart.destroy();
      }
      this.chart = this.createMonthlyChart();  
    }
  }
 
  createAnnualChart(): Chart {

    const yearMonthDate = new Date(this.yearMonth);
    var year = Number(this.year);
    var month =  (yearMonthDate.getMonth() + 1);

    // var earnings = this.getAnnualEarnings();
     var spendings = this.getAnnualSpendings();

    const earningsArray = this.earnings.map(entry => ({
      ...entry,
      beginDate: this.convertToDate(entry.recurrence.beginDate),
    }));

    const spendingArray = this.spendings.map(entry => ({
      ...entry,
      beginDate: this.convertToDate(entry.recurrence.beginDate),
    }));

    var groupEarningsByMonth:any = this.filterAndGroupDataByMonth(earningsArray, year);
    var groupSpendingByMonth:any = this.filterAndGroupDataByMonth(spendingArray, year);
    
    console.log(groupEarningsByMonth)
    var balance = [];
    for (var i = 0; i < groupEarningsByMonth.length; ++i) {
      balance.push(groupEarningsByMonth[i] - groupSpendingByMonth[i]);
    }
    return new Chart("BarChart", {
      type: 'bar',
      data: {
        labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
        datasets: [
          {
            label: "Earnings",
            data: groupEarningsByMonth,
            backgroundColor: 'lightblue'
          },
          {
            label: "Spendings",
            data: groupSpendingByMonth,
            backgroundColor: 'lightyellow'
          },
          {
            label: "Balance",
            data: balance,
            backgroundColor: 'darkgreen'
          },
        ]
      }
    });
  }

  createMonthlyChart(): Chart {
    const yearMonthDate = new Date(this.yearMonth);
    var year = yearMonthDate.getFullYear();
    var month =  (yearMonthDate.getMonth() + 1);
    
    const daysInMonth = this.countDaysInMonth(year, month);
    var yearMonth = `${year}-${month}`;

    const spendingArray =  this.spendings.map(entry => ({
      ...entry,
      beginDate: this.convertToDate(entry.recurrence.beginDate),
    }));


    const earningsArray = this.earnings.map(entry => ({
      ...entry,
      beginDate: this.convertToDate(entry.recurrence.beginDate),
    }));


    var EarningGroupedData:any = this.filterAndGroupDataByDay(earningsArray, year, month, daysInMonth);
    var SpendingGroupData:any = this.filterAndGroupDataByDay(spendingArray,year, month,  daysInMonth);
    var balance = [];

  
    for (var i = 0; i < EarningGroupedData.length; ++i) {
      balance.push(EarningGroupedData[i] - SpendingGroupData[i]);
    }


    let dateLabels = [];
    for (let day = 1; day <= daysInMonth; ++day) {
      let dateLabel = ('' + (month)).padStart(2, '0') + '/'  + ('' + day).padStart(2, '0');
      dateLabels.push(dateLabel);
    }
    return new Chart("BarChart", {
      type: 'bar',
      data: {
        labels: dateLabels,
        datasets: [
          {
            label: "Earnings",
            data: EarningGroupedData,
            backgroundColor: 'lightblue'
          },
          {
            label: "Spendings",
            data: SpendingGroupData,
            backgroundColor: 'lightyellow'
          },
          {
            label: "Balance",
            data: balance,
            backgroundColor: 'darkgreen'
          },
        ]
      }
    });
  }

  
  getAnnualSpendings(): Array<number> {
    if (this.year == '2023') {
      return [
        10272,
        12637,
        8372,
        7625,
        7453,
        11727,
        11763,
        9273,
        10827,
        7520,
        9282,
        11027
      ];
    }
    if (this.year == '2022') {
      return [
        10928,
        11726,
        10933,
        6555,
        10929,
        11888,
        13627,
        9928,
        10283,
        10936,
        11782,
        9182
      ];
    }
    if (this.year == '2021') {
      return [
        7026,
        6172,
        10928,
        8789,
        8099,
        8799,
        7023,
        7721,
        9890,
        7018,
        7940,
        7263
      ];
    }
    return [
      5647,
      6483,
      8272,
      6372,
      8927,
      8261,
      9018,
      7619,
      8029,
      7267,
      8172,
      8927
    ];
  }



  // https://javascript.plainenglish.io/how-to-determine-the-number-of-days-in-a-month-with-javascript-3d837575a398
  countDaysInMonth(year: number, month: number): any {
    return new Date(year, month, 0).getDate();
  }


  
  
  // Function to filter data based on year and month and store in a daily array
  filterAndGroupDataByDay(data, year, month, daysInMonth) {
    const result = Array.from({ length: daysInMonth }).fill(0);
    data.forEach(entry => {
      const d = this.convertToDate(entry.recurrence.beginDate);
      var entryYear = this.convertToDate(entry.recurrence.beginDate).getFullYear();
      var entryMonth =  (this.convertToDate(entry.recurrence.beginDate).getMonth() + 1)
      var entryDate = this.convertToDate(entry.recurrence.beginDate).getDate();

      if (entryYear === year && entryMonth === month) {
        result[entryDate - 1] = entry.amount;
      }

    });
  
    return result;
  }

  convertToDate(seconds) {
    const milliseconds = seconds.seconds * 1000; // Convert seconds to milliseconds
    const date = new Date(milliseconds);
   

    return date;
  }

  filterAndGroupDataByMonth(data, year) {
    // Create an object to store total earnings for each month
    const monthlyTotal = Array.from({ length: 12 }).fill(0);
  
    data.forEach(entry => {
      const entryYear = this.convertToDate(entry.recurrence.beginDate).getFullYear();
      
      // Check if the entry belongs to the specified year
      if (entryYear === year) {
        var entryMonth = this.convertToDate(entry.recurrence.beginDate).getMonth();
        if(!monthlyTotal[entryMonth]){
          monthlyTotal[entryMonth] = 0;
        }
        // Accumulate earnings for the month
        monthlyTotal[entryMonth] += entry.amount || 0;
      }
    });
  
    return monthlyTotal;
  }
  
  

}

