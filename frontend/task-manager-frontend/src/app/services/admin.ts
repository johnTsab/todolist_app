import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';


@Injectable({
  providedIn: 'root',
})


export class AdminService {
  private apiUrl = 'https://todolist-app-h7no.onrender.com/api'

  constructor(private http:HttpClient){}

  getUsers(){
    return this.http.get(`${this.apiUrl}/admin/users`);
  }

  deleteUser(userid:number){
      return this.http.delete(`${this.apiUrl}/admin/users/${userid}`);
    }

  getTasksofUser(userid:number){
    return this.http.get(`${this.apiUrl}/admin/users/${userid}/tasks`);
  }

  updateTaskofUser(userid:number, taskid:number,title:string,description:string){
    return this.http.post(`${this.apiUrl}/admin/users/${userid}/tasks/${taskid}`,{newtitle:title,newdescription:description});
  }

  deleteTaskofUser(userid:number,taskid:number){
    return this.http.delete(`${this.apiUrl}/admin/users/${userid}/tasks/${taskid}`,{});
  }
}
