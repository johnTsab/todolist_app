import { SocketService } from './../../services/socket';
import { AuthService } from './../../services/auth';
import { AdminService } from './../../services/admin';
import { Component, inject, OnInit, ChangeDetectorRef, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin',
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.html',
  styleUrl: './admin.css',
  encapsulation: ViewEncapsulation.None
})
export class Admin implements OnInit {
  users: any[] = [];
  selectedUser: any = null;
  userTasks: any[] = [];
  username = '';
  isAdmin = false;
  notification = '';

  editingTask: any = null;
  editTitle = '';
  editDescription = '';

  expandedTaskId: number | null = null;
  subtasksMap: { [taskId: number]: any[] } = {};
  editingSubtask: { taskId: number, subtaskId: number, title: string, description: string } | null = null;

  private AdminService = inject(AdminService);
  private AuthService = inject(AuthService);
  router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private SocketService = inject(SocketService);

  ngOnInit() {
    const token = localStorage.getItem('accessToken');
    if (token) {
      const decoded = JSON.parse(atob(token.split('.')[1]));
      this.username = decoded.username;
      this.isAdmin = decoded.role === 'ADMIN';
      this.SocketService.connect(decoded.userId);

      this.SocketService.on('admin_refresh', () => {
        this.loadUsers();
        if (this.selectedUser) {
          this.loadUserTasks(this.selectedUser.id);
        }
        if (this.expandedTaskId) {
          this.loadSubtasksOfTask(this.expandedTaskId);
        }
        this.cdr.detectChanges();
      });

      this.SocketService.on('notification', (data) => {
        this.notification = data.message;
        this.cdr.detectChanges();
        setTimeout(() => { this.notification = ''; this.cdr.detectChanges(); }, 4000);
      });
    }

    if (!this.isAdmin) {
      this.router.navigate(['/tasks']);
      return;
    }
    this.loadUsers();
  }

  completedCount() {
    return this.userTasks.filter(t => t.is_completed).length;
  }

  loadUsers() {
    this.AdminService.getUsers().subscribe({
      next: (response: any) => {
        this.users = [...response];
        this.cdr.detectChanges();
      },
      error: (err) => console.error(err)
    });
  }

  onSelectUser(user: any) {
    this.selectedUser = user;
    this.editingTask = null;
    this.expandedTaskId = null;
    this.subtasksMap = {};
    this.loadUserTasks(user.id);
  }

  onDeleteUser(userId: number) {
    this.AdminService.deleteUser(userId).subscribe({
      next: () => {
        this.selectedUser = null;
        this.userTasks = [];
        this.expandedTaskId = null;
        this.subtasksMap = {};
        this.loadUsers();
        this.cdr.detectChanges();
      },
      error: (err) => console.error(err)
    });
  }

  loadUserTasks(userId: number) {
    this.AdminService.getTasksofUser(userId).subscribe({
      next: (response: any) => {
        this.userTasks = response.map((t: any) => ({ ...t }));
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
      next: () => {
        this.loadUserTasks(this.selectedUser.id);
        this.editingTask = null;
        this.cdr.detectChanges();
      },
      error: (err) => console.error(err)
    });
  }

  onCancelEdit() {
    this.editingTask = null;
  }

  onDeleteTask(taskId: number) {
    this.AdminService.deleteTaskofUser(this.selectedUser.id, taskId).subscribe({
      next: () => {
        if (this.expandedTaskId === taskId) {
          this.expandedTaskId = null;
        }
        this.loadUserTasks(this.selectedUser.id);
        this.cdr.detectChanges();
      },
      error: (err) => console.error(err)
    });
  }

  onToggleCompletion(task: any) {
  this.AdminService.toggleTaskCompletion(this.selectedUser.id, task.id).subscribe({
    next: (response: any) => {
      task.is_completed = response.is_completed;
      this.cdr.detectChanges();
    },
    error: (err) => console.error(err)
  });
}

  onToggleSubtasks(task: any) {
    if (this.expandedTaskId === task.id) {
      this.expandedTaskId = null;
    } else {
      this.expandedTaskId = task.id;
      this.loadSubtasksOfTask(task.id);
    }
    this.editingSubtask = null;
    this.cdr.detectChanges();
  }

  loadSubtasksOfTask(taskId: number) {
    this.AdminService.getSubtasksOfUser(this.selectedUser.id, taskId).subscribe({
      next: (response: any) => {
        this.subtasksMap[taskId] = [...response];
        this.cdr.detectChanges();
      },
      error: (err) => console.error(err)
    });
  }

  onDeleteSubtaskOfUser(taskId: number, subtaskId: number) {
    this.AdminService.deleteSubtaskOfUser(this.selectedUser.id, taskId, subtaskId).subscribe({
      next: () => {
        this.loadSubtasksOfTask(taskId);
        this.cdr.detectChanges();
      },
      error: (err) => console.error(err)
    });
  }

  onEditSubtask(taskId: number, subtask: any) {
    this.editingSubtask = { taskId, subtaskId: subtask.id, title: subtask.title, description: subtask.description };
    this.cdr.detectChanges();
  }

  onCancelSubtaskEdit() {
    this.editingSubtask = null;
    this.cdr.detectChanges();
  }

  onSaveSubtaskEdit() {
    if (!this.editingSubtask) return;
    const { taskId, subtaskId, title, description } = this.editingSubtask;
    this.AdminService.updateSubtaskOfUser(this.selectedUser.id, taskId, subtaskId, title, description).subscribe({
      next: () => {
        this.loadSubtasksOfTask(taskId);
        this.editingSubtask = null;
        this.cdr.detectChanges();
      },
      error: (err) => console.error(err)
    });
  }

  onToggleSubtaskCompletion(taskId: number, subtask: any) {
  this.AdminService.toggleSubtaskCompletion(this.selectedUser.id, taskId, subtask.id).subscribe({
    next: (response: any) => {
      subtask.is_completed = response.is_completed;
      this.cdr.detectChanges();
    },
    error: (err) => console.error(err)
  });
}

  onLogout() {
    this.AuthService.logout().subscribe({
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
}