import { Recurrence } from "./recurrence";

export interface PayingTableEntry {
  name: string;
  amount: number;
  recurrence: Recurrence;
  id: string;
  userID: string;
}