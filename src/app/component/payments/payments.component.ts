import { Component, OnInit, Inject } from '@angular/core';
import { AuthService } from 'src/app/shared/auth.service';
import { Router } from '@angular/router';
import { PayingTableEntry } from 'src/app/model/paying-table-entry';
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
  selector: 'app-payments_earnings',
  templateUrl: './payments.component.html',
  styleUrls: ['./payments.component.css']
})
export class PaymentsComponent implements OnInit {  

  constructor(private firestore: AngularFirestore, private auth: AuthService, private router: Router, public dialog: MatDialog, private AngularFirestore: AngularFirestore, private data: DataService, private afs: AngularFirestore, private storage: AngularFireStorage,
    private FinanceService: FinancesService) {
  }

  totalPayments: number = 0;
  RecurrenceType = RecurrenceType;
  userID: string | null = null;
  payments: Array<PayingTableEntry> = new Array();
  tiles: Array<MatGridListTile> = new Array();

  ngOnInit(): void {
    if (!this.auth.checkUserLogin()) {
      this.router.navigate(['login']);
    } else {
      this.userID = this.auth.getUserId();
      this.loadPaymentsFromFirebase();
    }
  }

  savePaymentToFirebase(paying: PayingTableEntry): void {
    // Check if ID exists, if not generate a new one
    const payingId = paying.id || this.firestore.createId();
  
    // Use the set method with a specific document ID
    this.firestore.collection('newPayingMoney').doc(payingId).set(paying)
      .then(() => {
        console.log('Payment added to Firebase with ID: ', payingId, paying);
      })
      .catch(error => console.error('Error adding payment to Firebase: ', error));
  }

  isFirebaseTimestamp(timestamp: any): timestamp is { seconds: number, nanoseconds: number } {
    return timestamp && typeof timestamp.seconds === 'number' && typeof timestamp.nanoseconds === 'number';
  }
  
  updateMatGridList(): void {
    if (!this.payments || this.payments.length === 0) {
      return; // No data to display
    }
    this.tiles = new Array();
    this.tiles.push({cols: 10, cssClass: "list_header", content: "Name"});

    this.tiles.push({cols: 10, cssClass: "list_header", content: "Amount"});
    this.tiles.push({cols: 20, cssClass: "list_header", content: "When"});
    for (var i = 0; i < this.payments.length; ++i) {
      var styleName;
      if (i % 2 == 0) {
        styleName = "even_list_line";
      } else {
        styleName = "odd_list_line";
      }

      var payment = this.payments[i];
      this.tiles.push({cols: 10, cssClass: styleName, content: payment.name});
      this.tiles.push({cols: 10, cssClass: styleName, content: "$" + payment.amount});
      this.tiles.push({cols: 20, cssClass: styleName, content: recurrenceToString(payment.recurrence)});   

      // //have a firebase generated id for id
      // let id = this.payments[i].id;

      // //have the reccurence type be what the user selected
      // const payingToAdd = {name: this.payments[i].name, amount: this.payments[i].amount, recurrence: {recurrenceType:payment.recurrence.recurrenceType, beginDate: new Date()}, id};
      // this.savePaymentToFirebase(payingToAdd);
    }
  }

  
  loadPaymentsFromFirebase(): void {
    if (!this.userID) {
      console.error('User ID not available');
      return;
    }
    this.firestore.collection('newPayingMoney', ref => ref.where('userID', '==', this.userID))
    .snapshotChanges()
    .subscribe(actions => {
      this.payments = actions.map(a => {
        const data = a.payload.doc.data() as PayingTableEntry;
        const paymentId = a.payload.doc.id;

        // Convert Timestamps to Dates
        if (data.recurrence) {
          if (this.isFirebaseTimestamp(data.recurrence.beginDate)) {
            data.recurrence.beginDate = new Date(data.recurrence.beginDate.seconds * 1000);
          }
          if (this.isFirebaseTimestamp(data.recurrence.endDate)) {
            data.recurrence.endDate = new Date(data.recurrence.endDate.seconds * 1000);
          }
        }
        return { payingId: paymentId, ...data };
      });
      this.updateMatGridList();

      // Calculate the total payments
      this.totalPayments = this.payments.reduce((sum, payment) => sum + payment.amount, 0)
      console.log("Total Payments:", this.totalPayments);

      this.FinanceService.updatePayments(this.totalPayments);
    });
  }


  onAddNewPayment(): void {
    const modalWindow = this.dialog.open(AddPayingModal, {
      data: { name: null, amount: null, recurrence: null, beginDate: null },
      height: "450px",
      width: "600px",
    });
    modalWindow.afterClosed().subscribe(result => {
      if (!modalWindow.componentInstance.modalResult) {
        return;
      }
  
      const payingName = modalWindow.componentInstance.data.name;
      const payingAmount = modalWindow.componentInstance.data.amount;
      const payingRecurrence = modalWindow.componentInstance.data.recurrence;
      const payingBeginDate = new Date(modalWindow.componentInstance.data.beginDate);
  
      // Validate input
      if (payingName == null || payingAmount == null || payingAmount < 0 || payingRecurrence == null || payingBeginDate == null) {
        alert("Failed to add a new earning. Please, fill all fields in the form.");
        window.setTimeout(() => { this.onAddNewPayment() }, 100);
        return;
      }
  
      // Check if earning already exists
      const existingPayment = this.payments.find(e => e.name === payingName);
      if (existingPayment) {
        alert("Earning with this name already exists.");
        return;
      }

        
      // Create a new earning object
      const newPayment: PayingTableEntry = {
        id: this.firestore.createId(),
        name: payingName,
        amount: payingAmount,
        userID: this.auth.getUserId()!,
        recurrence: {
          recurrenceType: stringToRecurrenceType(payingRecurrence),
          beginDate: payingBeginDate
        }
      };

      console.log(payingBeginDate)
  
      // Save the new earning to Firebase
      this.savePaymentToFirebase(newPayment);
  
      // Add the new earning to the earnings array
      this.payments.push(newPayment);
  
      // Update the grid list to reflect the new earning
      this.updateMatGridList();
    });
  }

  onDeletePaying(): void {
    const names = this.payments.map(payment => payment.name);
  
    const modalWindow = this.dialog.open(DeletePayingModal, {
      data: { payingNames: names, chosenName: "" },
      height: "450px",
      width: "600px",
    });
  
    modalWindow.afterClosed().subscribe(result => {
      if (!modalWindow.componentInstance.modalResult) {
        return;
      }
      const chosenName = modalWindow.componentInstance.data.chosenName;
      const payingToDelete = this.payments.find(e => e.name === chosenName);
      if (payingToDelete) {
        this.deletePayingFromFirebase(payingToDelete).then(() => {
          this.payments = this.payments.filter(e => e.id !== payingToDelete.id);
          this.updateMatGridList();
        });
      }
    });
  }
  
  deletePayingFromFirebase(paying: PayingTableEntry): Promise<void> {
    if (!paying.id) {
      console.error('Error: Attempted to delete an payment without an ID');
      return Promise.reject('No ID provided');
    }
  
    return this.firestore.collection('newPayingMoney').doc(paying.id).delete()
      .then(() => {
        console.log('Payment deleted from Firebase', paying);
      })
      .catch(error => console.error('Error deleting payment from Firebase: ', error));
  }
  
 
}


export interface AddPayingModalData {
  name: string;
  amount: number;
  recurrence: string;
  beginDate: Date;
  id: string
};

@Component({
  selector: 'modal-add-payment',
  templateUrl: './modalAddPayment.html',
  styleUrls: ['./modalAddPayment.css'],
  standalone: true,
  imports: [MatDialogModule, MatFormFieldModule, MatInputModule, FormsModule, MatButtonModule],
})
export class AddPayingModal {

  modalResult: boolean = false;

  constructor(
    public dialogRef: MatDialogRef<AddPayingModal>,
    @Inject(MAT_DIALOG_DATA) public data: AddPayingModalData
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

export interface DeletePayingModalData {
  payingNames: Array<String>;
  chosenName: string;
};

@Component({
  selector: 'modal-delete-payment',
  templateUrl: './modalDeletePayment.html',
  styleUrls: ['./modalDeletePayment.css'],
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatFormFieldModule, MatInputModule, FormsModule, MatButtonModule],
})
export class DeletePayingModal {

  modalResult: boolean = false;

  constructor(
    public dialogRef: MatDialogRef<DeletePayingModal>,
    @Inject(MAT_DIALOG_DATA) public data: DeletePayingModalData
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