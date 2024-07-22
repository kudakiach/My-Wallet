export enum RecurrenceType {
OneOff=1,
Daily,
Weekly,
Monthly,
Annually,
beginDate
}

export interface Recurrence {
  recurrenceType: RecurrenceType;
  beginDate: Date;
  endDate?: Date;
}
