import { Component, OnInit, Inject } from '@angular/core';
import { AuthService } from 'src/app/shared/auth.service';
import { Router } from '@angular/router';
import { EarningTableEntry } from 'src/app/model/earning-table-entry';
import { Recurrence, RecurrenceType } from 'src/app/model/recurrence';
import { CommonModule } from '@angular/common';
import {MatDialog, MAT_DIALOG_DATA, MatDialogRef, MatDialogModule} from '@angular/material/dialog';
import {MatButtonModule} from '@angular/material/button';
import {FormsModule} from '@angular/forms';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { DataService } from 'src/app/shared/data.service';
import { FinancesService } from 'src/app/shared/finances.service';



export interface MatGridListTile {
  cols: number;
  cssClass: string;
  content: string;
}


function dateToString(d: Date): string {
  var year = d.getFullYear().toString();
  var month = (d.getMonth() + 1).toString().padStart(2, "0");
  var day = d.getDate().toString().padStart(2, "0");
  var hour = d.getHours().toString().padStart(2, "0");
  var minute = d.getMinutes().toString().padStart(2, "0");
  return `${year}-${month}-${day} ${hour}:${minute}`;
}

function recurrenceToString(rec: Recurrence): string {
  var result = "";
  if (rec.recurrenceType == RecurrenceType.OneOff) {
    result =  "One off on " + dateToString(rec.beginDate);
  } else if (rec.recurrenceType == RecurrenceType.Daily) {
    result = "Daily from " + dateToString(rec.beginDate);
  } else if (rec.recurrenceType == RecurrenceType.Weekly) {
    result = "Weekly from " + dateToString(rec.beginDate);
  } else if (rec.recurrenceType == RecurrenceType.Monthly) {
    result = "Monthly from " + dateToString(rec.beginDate);
  } else if (rec.recurrenceType == RecurrenceType.Annually) {
    result = "Annualy from " + dateToString(rec.beginDate);
  } else {
    return "Unknown";
  }
  if (rec.endDate != null) {
    result += " to " + dateToString(rec.endDate);
  }
return result;
}

function stringToRecurrenceType(rec: string): RecurrenceType {
  if (rec == "oneoff") {
    return RecurrenceType.OneOff;
  }
  if (rec == "daily") {
    return RecurrenceType.Daily;
  }
  if (rec == "weekly") {
    return RecurrenceType.Weekly;
  }
  if (rec == "monthly") {
    return RecurrenceType.Monthly;
  }
  if (rec == "annually") {
    return RecurrenceType.Annually;
  }
  throw new Error("Unknown recurrence string: " + rec);
}

@Component({
  selector: 'app-earnings',
  templateUrl: './earnings.html',
  styleUrls: ['./earnings.css'],
})
export class EarningsComponent implements OnInit {

  constructor(
    private firestore: AngularFirestore, private auth: AuthService, 
    private router: Router, public dialog: MatDialog, private AngularFirestore: AngularFirestore, 
    private data: DataService, private afs: AngularFirestore, private storage: AngularFireStorage, 
    private FinanceService: FinancesService) {

  }
  
  totalEarnings: number = 0;
  RecurrenceType = RecurrenceType;
  userID: string | null = null;
  earnings: Array<EarningTableEntry> = new Array();
  tiles: Array<MatGridListTile> = new Array();
  

  ngOnInit(): void {
    if (!this.auth.checkUserLogin()) {
      this.router.navigate(['login']);
    } else {
      this.userID = this.auth.getUserId();
      this.loadEarningsFromFirebase();
    }
  }
  
  
  saveEarningToFirebase(earning: EarningTableEntry): void {
    const earningId = earning.id || this.firestore.createId();
    this.firestore.collection('newEarningMoney').doc(earningId).set(earning)
      .then(() => {
        console.log('Earning saved to Firebase with ID:', earningId);
      })
      .catch(error => console.error('Error saving earning to Firebase:', error));
  }

  isFirebaseTimestamp(timestamp: any): timestamp is { seconds: number, nanoseconds: number } {
    return timestamp && typeof timestamp.seconds === 'number' && typeof timestamp.nanoseconds === 'number';
  }

  updateMatGridList(): void {
    if (!this.earnings || this.earnings.length === 0) {
      return; // No data to display
    }
   
    this.tiles = new Array();
    this.tiles.push({cols: 10, cssClass: "list_header", content: "Name"});
    this.tiles.push({cols: 10, cssClass: "list_header", content: "Amount"});
    this.tiles.push({cols: 20, cssClass: "list_header", content: "When"});
    for (var i = 0; i < this.earnings.length; ++i) {
      var styleName = i % 2 == 0 ? "even_list_line" : "odd_list_line";
      var earning = this.earnings[i];
      this.tiles.push({cols: 10, cssClass: styleName, content: earning.name});
      this.tiles.push({cols: 10, cssClass: styleName, content: "$" + earning.amount});
      this.tiles.push({cols: 20, cssClass: styleName, content: recurrenceToString(earning.recurrence)});   
    }
  }
  

  loadEarningsFromFirebase(): void {
    if (!this.userID) {
      console.error('User ID not available');
      return;
    }
  
    this.firestore.collection('newEarningMoney', ref => ref.where('userID', '==', this.userID))
      .snapshotChanges()
      .subscribe(actions => {
        this.earnings = actions.map(a => {
          const data = a.payload.doc.data() as EarningTableEntry;
          const earningId = a.payload.doc.id;
  
          // Convert Timestamps to Dates
          if (data.recurrence) {
            if (this.isFirebaseTimestamp(data.recurrence.beginDate)) {
              data.recurrence.beginDate = new Date(data.recurrence.beginDate.seconds * 1000);
            }
            if (this.isFirebaseTimestamp(data.recurrence.endDate)) {
              data.recurrence.endDate = new Date(data.recurrence.endDate.seconds * 1000);
            }
          }
  
          return { earningId, ...data };
        });
        this.updateMatGridList();
      // Calculate the total earnings
      this.totalEarnings = this.earnings.reduce((sum, earning) => sum + earning.amount, 0);
      console.log("Total Earnings:", this.totalEarnings);
      this.FinanceService.updateEarnings(this.totalEarnings);
      
    });
    
  }


  onAddNewEarning(): void {
    const modalWindow = this.dialog.open(AddEarningModal, {
      data: { name: null, amount: null, recurrence: null, beginDate: null },
      height: "450px",
      width: "600px",
    });
    modalWindow.afterClosed().subscribe(result => {
      if (!modalWindow.componentInstance.modalResult) {
        return;
      }

      const earningName = modalWindow.componentInstance.data.name;
      const earningAmount = modalWindow.componentInstance.data.amount;
      const earningRecurrence = modalWindow.componentInstance.data.recurrence;
      const earningBeginDate = new Date(modalWindow.componentInstance.data.beginDate);

      // Validate input
      if (earningName == null || earningAmount == null || earningAmount < 0 || earningRecurrence == null || earningBeginDate == null) {
        alert("Failed to add a new earning. Please, fill all fields in the form.");
        window.setTimeout(() => { this.onAddNewEarning() }, 100);
        return;
      }

      // Check if earning already exists
      const existingEarning = this.earnings.find(e => e.name === earningName);
      if (existingEarning) {
        alert("Earning with this name already exists.");
        return;
      }

      // Create a new earning object
      const newEarning: EarningTableEntry = {
        id: this.firestore.createId(),
        name: earningName,
        amount: earningAmount,
        userID: this.auth.getUserId()!,
        recurrence: {
          recurrenceType: stringToRecurrenceType(earningRecurrence),
          beginDate: earningBeginDate
        }
      };

      // Save the new earning to Firebase
      this.saveEarningToFirebase(newEarning);

      // Add the new earning to the earnings array
      this.earnings.push(newEarning);

      // Update the grid list to reflect the new earning
      this.updateMatGridList();
    });
  }
  
  

  onDeleteEarning(): void {
    const names = this.earnings.map(earning => earning.name);
  
    const modalWindow = this.dialog.open(DeleteEarningModal, {
      data: { earningNames: names, chosenName: "" },
      height: "450px",
      width: "600px",
    });
  
    modalWindow.afterClosed().subscribe(result => {
      if (!modalWindow.componentInstance.modalResult) {
        return;
      }
      const chosenName = modalWindow.componentInstance.data.chosenName;
      const earningToDelete = this.earnings.find(e => e.name === chosenName);
      if (earningToDelete) {
        this.deleteEarningFromFirebase(earningToDelete).then(() => {
          this.earnings = this.earnings.filter(e => e.id !== earningToDelete.id);
          this.updateMatGridList();
        });
      }
    });
  }
  
  deleteEarningFromFirebase(earning: EarningTableEntry): Promise<void> {
    if (!earning.id) {
      console.error('Error: Attempted to delete an earning without an ID');
      return Promise.reject('No ID provided');
    }
  
    return this.firestore.collection('newEarningMoney').doc(earning.id).delete()
      .then(() => {
        console.log('Earning deleted from Firebase', earning);
      })
      .catch(error => console.error('Error deleting earning from Firebase: ', error));
  }
  
  
 
}


export interface AddEarningModalData {
  name: string;
  amount: number;
  recurrence: string;
  beginDate: Date;
  id: string
};

@Component({
  selector: 'modal-add-earning',
  templateUrl: './modalAddEarning.html',
  styleUrls: ['./modalAddEarning.css'],
  standalone: true,
  imports: [MatDialogModule, MatFormFieldModule, MatInputModule, FormsModule, MatButtonModule],
})
export class AddEarningModal {

  modalResult: boolean = false;

  constructor(
    public dialogRef: MatDialogRef<AddEarningModal>,
    @Inject(MAT_DIALOG_DATA) public data: AddEarningModalData
  ) {
  }

  onAddClick(): void {
    console.log("onAddClick");
    this.modalResult = true;
    console.log();
  }

  onCancelClick(): void {
    console.log("onCancelClick");
    this.modalResult = false;
  }
}

export interface DeleteEarningModalData {
  earningNames: Array<String>;
  chosenName: string;
};

@Component({
  selector: 'modal-delete-earning',
  templateUrl: './modalDeleteEarning.html',
  styleUrls: ['./modalDeleteEarning.css'],
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatFormFieldModule, MatInputModule, FormsModule, MatButtonModule],
})
export class DeleteEarningModal {

  modalResult: boolean = false;

  constructor(
    public dialogRef: MatDialogRef<DeleteEarningModal>,
    @Inject(MAT_DIALOG_DATA) public data: DeleteEarningModalData
  ) {
  }

  onDeleteClick(): void {
    console.log("onDeleteClick");
    this.modalResult = true;
  }

  onCancelClick(): void {
    console.log("onCancelClick");
    this.modalResult = false;
  }
}