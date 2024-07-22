import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './component/dashboard/dashboard.component';
import { LoginComponent } from './component/login/login.component';
import { RegisterComponent } from './component/register/register.component';
import { PaymentsComponent } from './component/payments/payments.component';
import { AboutComponent } from './component/about/about.component';
import { EarningsComponent } from './component/earnings/earnings.component';
import { ReportsComponent } from './component/reports/reports.component'
import { ForgotpasswordComponent } from './component/forgotpassword/forgotpassword.component';
import { VerifyemailComponent } from './component/verifyemail/verifyemail.component';
import { ProfileComponent } from './component/profile/profile.component';
import { LogoutComponent } from './component/logout/logout.component';
import { BalanceComponent } from './component/balance/balance.component';

const routes: Routes = [

  {path: '', redirectTo: 'login', pathMatch: 'full'},
  {path: 'login', component: LoginComponent},
  {path: 'dashboard', component: DashboardComponent},
  {path: 'register', component: RegisterComponent},
  {path: 'payments_earnings', component: PaymentsComponent},
  {path: 'recurrent_payments_earnings', component: EarningsComponent},
  {path: 'reports', component: ReportsComponent},
  {path: 'about', component: AboutComponent},
  {path: 'forgotpassword', component: ForgotpasswordComponent},
  {path: 'verifyemail', component: VerifyemailComponent},
  {path: 'profile', component: ProfileComponent},
  {path: 'logout', component: LogoutComponent},
  {path: 'balance', component: BalanceComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
