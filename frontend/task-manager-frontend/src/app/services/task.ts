import { Injectable,inject } from '@angular/core';
import { HttpClient,HttpHeaders } from '@angular/common/http';
import { authInterceptor } from '../interceptors/auth-interceptor';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import { Task, Subtask, Log } from '../models/task.model';
@Injectable({
  providedIn: 'root',
})

export class TaskService {
  private apiUrl= environment.apiUrl;
  private http = inject(HttpClient);

 

  getTasks():Observable<Task[]>{
    return this.http.get<Task[]>(`${this.apiUrl}/tasks`);
  }
  
  addTask(title:string,description:string):Observable<Task>{
    return this.http.post<Task>(`${this.apiUrl}/tasks?t=${Date.now()}`,{title,description});
  }

  deleteTask(id:number):Observable<void>{
    return this.http.delete<void>(`${this.apiUrl}/tasks/${id}`);
  }

  toggleTask(id:number):Observable<void>{
     return this.http.patch<void>(`${this.apiUrl}/tasks/${id}/complete`,{});
  }

  updateTask(id: number, title: string, description: string):Observable<void> {
  return this.http.post<void>(`${this.apiUrl}/tasks/${id}`, { newtitle: title, newdescription: description });
}

getsubTasks(id:number):Observable<Subtask[]>{
  return this.http.get<Subtask[]>(`${this.apiUrl}/tasks/${id}/subtasks`);
}

addsubTask(id:number,title:string,description:string):Observable<Subtask>{
  return this.http.post<Subtask>(`${this.apiUrl}/tasks/${id}/subtasks`,{title: title,description: description});
}

deleteSubTask(id:number,subid:number):Observable<void>{
  return this.http.delete<void>(`${this.apiUrl}/tasks/${id}/subtasks/${subid}`,{});
}

toggleSubtask(id:number,subid:number):Observable<void>{
 return this.http.patch<void>(`${this.apiUrl}/tasks/${id}/subtasks/${subid}/complete`,{});
}

  updateSubtask(id: number,subid:number, title: string, description: string):Observable<void>{
  return this.http.post<void>(`${this.apiUrl}/tasks/${id}/subtasks/${subid}`, { newTitle: title, newDescription: description });
}

getLogs():Observable<Log[]>{
  return this.http.get<Log[]>(`${this.apiUrl}/logs`);
}

}

