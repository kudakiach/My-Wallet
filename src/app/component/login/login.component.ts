import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/shared/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  
  email : string = '';
  password : string = '';

  constructor(private auth: AuthService) { }

  ngOnInit(): void {
  }

  login() {
    if (this.email == ''){
      alert ('Please enter email');
      return;
    }

    if (this.password == ''){
      alert ('Please enter password');
      return;
    }

    this.auth.login(this.email, this.password);

    this.email = '';
    this.password = '';

  }

  /**
   * Firebase: The given sign-in provider is disabled for this Firebase project. Enable it in the Firebase console, under the sign-in method tab of the Auth section. (auth/operation-not-allowed)
   */
  loginWithGoogle() {
    this.auth.googleSignIn();
  }

}
