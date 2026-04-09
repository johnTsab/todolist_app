import { Injectable,inject } from '@angular/core';
import { HttpClient,HttpHeaders } from '@angular/common/http';
import { authInterceptor } from '../interceptors/auth-interceptor';
import { environment } from '../../environments/environment';
@Injectable({
  providedIn: 'root',
})

export class Task {
  private apiUrl= environment.apiUrl;
  private http = inject(HttpClient);

 

  getTasks(){
    return this.http.get(`${this.apiUrl}/tasks`);
  }
  
  addTask(title:string,description:string){
    return this.http.post(`${this.apiUrl}/tasks?t=${Date.now()}`,{title,description});
  }

  deleteTask(id:number){
    return this.http.delete(`${this.apiUrl}/tasks/${id}`);
  }

  toggleTask(id:number){
     return this.http.patch(`${this.apiUrl}/tasks/${id}/complete`,{});
  }

  updateTask(id: number, title: string, description: string) {
  return this.http.post(`${this.apiUrl}/tasks/${id}`, { newtitle: title, newdescription: description });
}

getsubTasks(id:number){
  return this.http.get(`${this.apiUrl}/tasks/${id}/subtasks`);
}

addsubTask(id:number,title:string,description:string){
  return this.http.post(`${this.apiUrl}/tasks/${id}/subtasks`,{title: title,description: description});
}

deleteSubTask(id:number,subid:number){
  return this.http.delete(`${this.apiUrl}/tasks/${id}/subtasks/${subid}`,{});
}

toggleSubtask(id:number,subid:number){
 return this.http.patch(`${this.apiUrl}/tasks/${id}/subtasks/${subid}/complete`,{});
}

getLogs(){
  return this.http.get(`${this.apiUrl}/logs`);
}

}

