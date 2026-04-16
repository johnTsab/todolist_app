import { SocketService } from './../../services/socket';
import { Component, inject, OnInit, ChangeDetectorRef, ViewEncapsulation } from '@angular/core';
import { TaskService } from '../../services/task';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-tasks',
  imports: [CommonModule, FormsModule],
  templateUrl: './tasks.html',
  styleUrl: './tasks.css',
  encapsulation: ViewEncapsulation.None
})
export class Tasks implements OnInit {
  isAdmin = false;
  tasks: any[] = [];
  username = '';
  newTaskTitle = '';
  newTaskDescription = '';
  editingTask: any = null;
  editTitle = '';
  editDescription = '';
  notification = '';

  // Inline subtasks (dropdown style)
  expandedTaskId: number | null = null;
  subtasksMap: { [taskId: number]: any[] } = {};
  newSubtaskTitle = '';
  newSubTaskDescription = '';
  editingSubtask: { taskId: number, subtaskId: number, title: string, description: string } | null = null;

  private taskService = inject(TaskService);
  router = inject(Router);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);
  private SocketService = inject(SocketService);

  ngOnInit() {
    const token = localStorage.getItem('accessToken');
    if (token) {
      const decoded = JSON.parse(atob(token.split('.')[1]));
      this.username = decoded.username;
      this.isAdmin = decoded.role === 'ADMIN';
      this.SocketService.connect(decoded.userId);

      this.SocketService.on('notification', (data) => {
        this.notification = data.message;
        this.loadTasks();
        if (this.expandedTaskId) {
          this.loadSubtasksOfTask(this.expandedTaskId);
        }
        this.cdr.detectChanges();
        setTimeout(() => { this.notification = ''; this.cdr.detectChanges(); }, 4000);
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
      error: (err) => console.error('Σφάλμα', err)
    });
  }

  onAddTask() {
    this.taskService.addTask(this.newTaskTitle, this.newTaskDescription).subscribe({
      next: () => {
        this.loadTasks();
        this.newTaskTitle = '';
        this.newTaskDescription = '';
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
    this.taskService.updateTask(this.editingTask.id, this.editTitle, this.editDescription).subscribe({
      next: () => {
        this.loadTasks();
        this.editingTask = null;
      },
      error: (err) => console.error(err)
    });
  }

  onCancelEdit() {
    this.editingTask = null;
  }

  onDeleteTask(task: any) {
    this.taskService.deleteTask(task.id).subscribe({
      next: () => {
        this.loadTasks();
        this.cdr.detectChanges();
      },
      error: (err) => console.error(err)
    });
  }

  onToggleComplete(task: any) {
    this.taskService.toggleTask(task.id).subscribe({
      next: () => {
        this.loadTasks();
        this.cdr.detectChanges();
      },
      error: (err) => console.error(err)
    });
  }

  // ── Inline Subtasks ──

  onToggleSubtasks(task: any) {
    if (this.expandedTaskId === task.id) {
      this.expandedTaskId = null;
    } else {
      this.expandedTaskId = task.id;
      this.loadSubtasksOfTask(task.id);
    }
    this.newSubtaskTitle = '';
    this.newSubTaskDescription = '';
    this.editingSubtask = null;
    this.cdr.detectChanges();
  }

  loadSubtasksOfTask(taskId: number) {
    this.taskService.getsubTasks(taskId).subscribe({
      next: (response: any) => {
        this.subtasksMap[taskId] = [...response];
        this.cdr.detectChanges();
      },
      error: (err) => console.error(err)
    });
  }

  onAddSubtask(taskId: number) {
    if (!this.newSubtaskTitle.trim()) return;
    this.taskService.addsubTask(taskId, this.newSubtaskTitle, this.newSubTaskDescription).subscribe({
      next: () => {
        this.loadSubtasksOfTask(taskId);
        this.loadTasks();
        this.newSubtaskTitle = '';
        this.newSubTaskDescription = '';
        this.cdr.detectChanges();
      },
      error: (err) => console.error(err)
    });
  }

  onDeleteSubtask(subtaskId: number) {
    if (!this.expandedTaskId) return;
    this.taskService.deleteSubTask(this.expandedTaskId, subtaskId).subscribe({
      next: () => {
        this.loadSubtasksOfTask(this.expandedTaskId!);
        this.loadTasks();
        this.cdr.detectChanges();
      },
      error: (err) => console.error(err)
    });
  }

  onToggleCompleteSub(subtask: any) {
    if (!this.expandedTaskId) return;
    this.taskService.toggleSubtask(this.expandedTaskId, subtask.id).subscribe({
      next: () => {
        this.loadSubtasksOfTask(this.expandedTaskId!);
        this.cdr.detectChanges();
      },
      error: (err) => console.error(err)
    });
  }

  onEditSubtask(taskId: number, subtask: any) {
    this.editingSubtask = { taskId, subtaskId: subtask.id, title: subtask.title, description: subtask.description };
    this.cdr.detectChanges();
  }

  onSaveSubtaskEdit() {
   if (!this.editingSubtask) return;
   const { taskId, subtaskId, title, description } = this.editingSubtask;
   this.taskService.updateSubtask(taskId, subtaskId, title, description).subscribe({
      next: () => {
      this.loadSubtasksOfTask(taskId);
      this.editingSubtask = null;
       this.cdr.detectChanges();
      },
      error: (err) => console.error(err)
    });
  }

  onCancelSubtaskEdit() {
    this.editingSubtask = null;
    this.cdr.detectChanges();
  }

  onLogout() {
    this.authService.logout().subscribe({
      next: () => {
        localStorage.clear();
        this.router.navigate(['/login']);
      },
      error: (err) => console.error(err)
    });
  }
}