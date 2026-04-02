import { AuthService } from './../../services/auth';
import { AdminService } from './../../services/admin';
import { Component,inject, OnInit, ChangeDetectorRef, ViewEncapsulation } from '@angular/core';
import {Task} from '../../services/task';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {Router} from '@angular/router';


@Component({
  selector: 'app-admin',
  imports: [CommonModule,FormsModule],
  templateUrl: './admin.html',
  styleUrl: './admin.css',
  encapsulation: ViewEncapsulation.None
})
export class Admin implements OnInit {
  users:any[] = [];
  selectedUser: any = null;
  userTasks: any[] = [];
  username = '';
  isAdmin = false;

  editingTask: any = null;
  editTitle='';
  editDescription = '';

  private AdminService = inject(AdminService)
  private AuthService = inject(AuthService);
  private TaskService = inject(Task);
  router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit(){
    const token = localStorage.getItem('accessToken');
    if(token){
      const decoded = JSON.parse(atob(token.split('.')[1]));
      this.username = decoded.username;
      this.isAdmin = decoded.role === "ADMIN";
    }
    if(!this.isAdmin){
      this.router.navigate(["/tasks"]);
      return;
    }
    this.loadUsers();
  }

  completedCount() {
  return this.userTasks.filter(t => t.is_completed).length;
}

  loadUsers(){
    this.AdminService.getUsers().subscribe({
      next:(response:any)=>{
        this.users = [...response];
        this.cdr.detectChanges();
      },
      error:(err)=>{console.error(err)}
    });
  }

  onSelectUser(user:any){
    this.selectedUser = user;
    this.editingTask = null;
    this.loadUserTasks(user.id);
  }

   onDeleteUser(userId: number) {
    this.AdminService.deleteUser(userId).subscribe({
      next: () => {
        this.selectedUser = null;
        this.userTasks = [];
        this.loadUsers();
        this.cdr.detectChanges();
      },
      error: (err) => console.error(err)
    });
  }

  loadUserTasks(userId: number) {
  this.AdminService.getTasksofUser(userId).subscribe({
    next: (response: any) => {
      this.userTasks = [...response]; // ← userTasks όχι users
      this.cdr.detectChanges();
    },
    error: (err) => console.error(err)
  });
}

  onEditTask(task: any) {
    this.editingTask = task;
    this.editTitle = task.title;
    this.editDescription = task.description;
    this.cdr.detectChanges();
  }

  onSaveEdit() {
    if (!this.editingTask) return;
    this.AdminService.updateTaskofUser(this.selectedUser.id, this.editingTask.id, this.editTitle, this.editDescription).subscribe({
      next: (response:any) => {
        this.loadUserTasks(this.selectedUser.id);
        this.editingTask = null;
        this.cdr.detectChanges();
      },
      error: (err) => console.error(err)
    });
  }

  onCancelEdit() {
    this.editingTask = null;
    this.cdr.detectChanges();
  }

   onDeleteTask(taskId: number) {
    this.AdminService.deleteTaskofUser(this.selectedUser.id, taskId).subscribe({
      next: (response:any) => {
        this.loadUserTasks(this.selectedUser.id);
        this.cdr.detectChanges();
      },
      error: (err) => console.error(err)
    });
  }

  






}
