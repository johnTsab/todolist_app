import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = environment.apiUrl;

  constructor(private http:HttpClient){}

  login(username:string,password:string){
    return this.http.post(`${this.apiUrl}/login`,{username,password},{ withCredentials: true });
  }
  
  logout(){
    return this.http.post(`${this.apiUrl}/logout`,null,{ withCredentials: true });
  }

  register(username:string,password:string,confirmPassword:string,email:string){
    return this.http.post(`${this.apiUrl}/signup`,{username,password,confirmPassword,email},{ withCredentials: true });
  }

  refresh(){
    return this.http.post(`${this.apiUrl}/refresh`,{ withCredentials: true });
  }
}
