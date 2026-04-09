import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import { environment } from '../../environments/environment';


@Injectable({
  providedIn: 'root',
})


export class AdminService {
  private apiUrl = environment.apiUrl;

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

getSubtasksOfUser(userId: number, taskId: number) {
  return this.http.get(`${this.apiUrl}/admin/users/${userId}/tasks/${taskId}/subtasks`);
}

deleteSubtaskOfUser(userId: number, taskId: number, subtaskId: number) {
  return this.http.delete(`${this.apiUrl}/admin/users/${userId}/tasks/${taskId}/subtasks/${subtaskId}`);
}

updateSubtaskOfUser(userId: number, taskId: number, subtaskId: number, title:string, description:string) {
  return this.http.post(`${this.apiUrl}/admin/users/${userId}/tasks/${taskId}/subtasks/${subtaskId}`, {newtitle:title,newdescription:description});
}

}
