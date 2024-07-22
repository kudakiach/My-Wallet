import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/shared/auth.service';
import { AngularFireAuth} from '@angular/fire/compat/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {

  firstName: string = '';
  lastName: string ='';

  constructor(private auth: AuthService, private fireauth : AngularFireAuth, private router : Router) { }

  ngOnInit(): void {
    if (!this.auth.checkUserLogin()) {
      this.router.navigate(['login']);
    }
    this.displayProfile();
  }

  async displayProfile() {
    const currentUser = await this.fireauth.currentUser;
    if (currentUser) {
      const firstAndLastName = currentUser.displayName?.split(' ');
      if (firstAndLastName) {
        this.firstName = firstAndLastName[0];
        if (firstAndLastName.length > 1) {
          this.lastName = firstAndLastName[1];
        }
      }
    }
  }

  async updateProfile() {
    const currentUser = await this.fireauth.currentUser;
    if (currentUser) {
      const fullName = this.firstName + ' ' + this.lastName;
      currentUser.updateProfile({ displayName: fullName });
    }
  }


}