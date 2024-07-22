import { Injectable } from '@angular/core';
import { AngularFireAuth,   } from '@angular/fire/compat/auth';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import { GoogleAuthProvider, User} from '@angular/fire/auth';
import { Router } from '@angular/router';
import { FinancesService } from './finances.service';
import { getAuth, sendEmailVerification } from "firebase/auth";


@Injectable({
  providedIn: 'root'
})


export class AuthService {
  currentUser: firebase.User | null = null;
  
  constructor(private fireauth: AngularFireAuth, private router: Router, private financesService: FinancesService) {
    this.fireauth.authState.subscribe(user => {
      this.currentUser = user;
      if (user) {
        localStorage.setItem('userID', user.uid);
      }
    });
  }

  //login 
  login (email : string, password : string ){
    this.fireauth.signInWithEmailAndPassword(email, password).then(res => {
      localStorage.setItem('userProfile', JSON.stringify(res));
      localStorage.setItem('userID', JSON.stringify(res.user?.uid));
      
      if(res.user?.emailVerified == true) {
        this.router.navigate(['dashboard']);
      } else {
        this.router.navigate(['verifyemail'])
      }

      
    },err => {
      alert(err.message);
      this.router.navigate(['/login']);
    })
  }

  //register method
  register(email: string, password: string, firstName: string, lastName: string) {
    this.fireauth.createUserWithEmailAndPassword(email, password).then(res => {
      localStorage.setItem('userProfile', JSON.stringify(res));
      localStorage.setItem('userID', JSON.stringify(res.user?.uid));

      this.updateProfileOnRegister(firstName, lastName);

      this.sendEmailForVerification(email);
      this.router.navigate(['verifyemail']);
    },err => {
      alert(err.message);
      this.router.navigate(['register']);
    })
  }

  async updateProfileOnRegister(firstName: string, lastName: string) {
    const currentUser = await this.fireauth.currentUser;
    currentUser?.updateProfile({
      displayName: firstName + " " + lastName
    });
  }
  
  //sign out
  logout (){
    this.fireauth.signOut().then(() => {
      localStorage.removeItem('token');
      this.router.navigate(['/login']);
    },err => {
      alert(err.message);
    })
  }

  // forgot password
  forgotPassword(email : string) {
    this.fireauth.sendPasswordResetEmail(email).then(() => {
      this.router.navigate(['/verifyemail'])
    }, err => {
      alert('ERROR: Something went wrong');
    })
  }

  //email verification
  async sendEmailForVerification(user: any) {
    const currentUser = await this.fireauth.currentUser;
    await sendEmailVerification(currentUser);
    console.log("Email verification sent!")
  }

  //sign in with google
  googleSignIn() {
    return this.fireauth.signInWithPopup(new GoogleAuthProvider).then(res => {
      localStorage.setItem('userProfile', JSON.stringify(res));
      localStorage.setItem('userID', JSON.stringify(res.user?.uid));
      this.router.navigate(['/dashboard']);
    }, err => {
      alert(err.message);
    })
  }

  checkUserLogin() {
    if (localStorage.getItem('userID') == null) {
      return false;
    }
    return true;
  }

 // New method to get userId
  getUserId(): string | null {
    return this.currentUser ? this.currentUser.uid : null;
  }
}
