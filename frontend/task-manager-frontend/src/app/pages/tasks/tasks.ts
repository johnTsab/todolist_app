import { SocketService } from './../../services/socket';
import { Component, inject, OnInit, ChangeDetectorRef,ViewEncapsulation } from '@angular/core';
import { Task } from '../../services/task';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-tasks',
  imports: [CommonModule,FormsModule],
  templateUrl: './tasks.html',
  styleUrl: './tasks.css',
  encapsulation: ViewEncapsulation.None
})
export class Tasks implements OnInit {
  isAdmin=false;
  tasks: any[] = [];
  username = '';
  newTaskTitle = '';
  newTaskDescription = '';
  editingTask: any = null;
  editTitle='';
  editDescription ='';
  selectedTask : any=null;
  subtasks: any[]=[];
  newSubtaskTitle='';
  newSubTaskDescription='';
  notification = '';

  private taskService = inject(Task);
  router = inject(Router);
private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef); 
  private SocketService = inject(SocketService);
  

  ngOnInit() {
    const token = localStorage.getItem('accessToken');
    if(token){
      const decoded = JSON.parse(atob(token.split('.')[1]));
      this.username = decoded.username;
      this.isAdmin = decoded.role === "ADMIN";
    this.SocketService.connect(decoded.userId);
console.log('Connecting socket with userId:', decoded.id);

this.SocketService.on('notification', (data) => {
  console.log('Notification received!', data);
  this.loadTasks();
  if(this.selectedTask){
    this.loadSubtasks(this.selectedTask.id);
  }
  this.cdr.detectChanges();
  this.notification = data.message;
  setTimeout(() => { this.notification = ''; this.cdr.detectChanges(); }, 10000);
});
    }
    this.loadTasks();
  }


  loadTasks() {
    this.taskService.getTasks().subscribe({
      next: (response: any) => {
         this.tasks = response; 
        this.cdr.detectChanges(); 
      },
      error: (err) => {
        console.error('Σφάλμα', err);
      }
    });
  }

  onAddTask() {
    this.taskService.addTask(this.newTaskTitle,this.newTaskDescription).subscribe({
      next:(response:any)=>{
        this.loadTasks();
        this.newTaskTitle='';
        this.newTaskDescription='';
        //this.tasks=[...response];
        console.log('Task added succesfully');
        this.cdr.detectChanges();
      },
      error: (err) => console.error(err)
    });
  }

  onEditTask(task: any) {
    this.editingTask=task; //ανοιξε το edit panel για αυτο το τασκ 
    this.editTitle = task.title;
    this.editDescription = task.description;
    this.cdr.detectChanges();

  }

  onDeleteTask(task:any) {
    this.taskService.deleteTask(task.id).subscribe({
      next:(response:any)=>{
        console.log("task deleted succesfully");
        this.loadTasks();
        this.cdr.detectChanges();
      },
      error:(err)=> console.error(err)
    });
  }

  onToggleComplete(task:any){
    this.taskService.toggleTask(task.id).subscribe({
      next:(response:any)=>{
        this.loadTasks();
        this.cdr.detectChanges();
      },
      error:(err)=> console.error(err)
    });
  }

  loadSubtasks(taskId:number){
   this.taskService.getsubTasks(taskId).subscribe({
    next:(response:any)=>{
      this.subtasks = response;
      this.cdr.detectChanges();
    },
    error:(err)=>{
      console.error('Σφάλμα', err);
    }
   });
  }

  onViewSubtasks(task: any) {
    this.selectedTask = task;
    this.loadSubtasks(task.id);
    this.cdr.detectChanges();
  }

  onClosePanel(){
    this.selectedTask = null;
    this.subtasks = [];
    this.cdr.detectChanges()
  }

  onAddSubtask(){
    console.log('newSubtaskTitle:', this.newSubtaskTitle);
    if (!this.selectedTask) return;
  this.taskService.addsubTask(this.selectedTask.id, this.newSubtaskTitle, this.newSubTaskDescription).subscribe({
    next: (response: any) => {
      this.loadSubtasks(this.selectedTask.id);
      this.newSubtaskTitle = '';
      this.newSubTaskDescription = '';
      this.loadTasks();
      this.cdr.detectChanges();
    },
    error: (err) => console.error(err)
  });
  }


    onDeleteSubtask(id: number) {
  this.taskService.deleteSubTask(this.selectedTask.id, id).subscribe({
    next: () => {
      this.loadSubtasks(this.selectedTask.id);
      this.loadTasks();
      this.cdr.detectChanges();
    },
    error: (err) => console.error(err)
  });
  }

  onToggleCompleteSub(subtask:any){
    this.taskService.toggleSubtask(this.selectedTask.id,subtask.id).subscribe({
      next:(response:any)=>{
        this.loadSubtasks(this.selectedTask.id);
        this.cdr.detectChanges();
      },
      error:(err)=>{console.log(err)}
    })
  }

  onLogout() {
    this.authService.logout().subscribe({
      next:(response:any)=>{
        localStorage.clear;
        console.log('Logout επιτυχες!');
        this.router.navigate(['/login']);
      },
      error:(err)=>{
        console.log('Error',err)
      }
    });
  }

  onSaveEdit() {
    if(!this.editingTask) return;
  this.taskService.updateTask(this.editingTask.id, this.editTitle, this.editDescription).subscribe({
    next: () => {
      this.loadTasks();
      this.editingTask = null;  
    },
    error: (err) => console.error(err)
  });
}

onCancelEdit() {
  this.editingTask = null;      // "κλείσε" χωρίς αποθήκευση
}

}