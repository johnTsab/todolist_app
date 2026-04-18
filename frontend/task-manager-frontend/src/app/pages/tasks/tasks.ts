import { DecodedToken } from './../../models/task.model';
import { SocketService } from './../../services/socket';
import { Component, inject, OnInit, ChangeDetectorRef, ViewEncapsulation,signal} from '@angular/core';
import { TaskService } from '../../services/task';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth';
import {Task,Subtask,SubtaskEdit} from '../../models/task.model';
import { ChangeDetectionStrategy } from '@angular/core';


@Component({
  selector: 'app-tasks',
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tasks.html',
  styleUrl: './tasks.css',
  encapsulation: ViewEncapsulation.None
})
export class Tasks implements OnInit {
  editTaskForm = {title:'',description:''};
  isAdmin = false;
  tasks = signal<Task[]>([]);
  username = '';
  newTaskTitle = '';
  newTaskDescription = '';
  editingTask = signal<Task|null>(null);
  notification =signal('');

  // Inline subtasks
  editSubtaskForm = {title:'',description:''};
  expandedTaskId = signal<number|null>(null);
  subtasksMap= signal<Record<number,Subtask[]>>({});
  newSubtaskTitle = '';
  newSubTaskDescription = '';
  editingSubtask=signal<SubtaskEdit|null>(null);

  private taskService = inject(TaskService);
  router = inject(Router);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);
  private SocketService = inject(SocketService);

  ngOnInit() {
    const decodedToken = this.authService.getDecodedToken(); //return decoded token
    if (decodedToken) {
      this.username = decodedToken.username
      this.isAdmin = decodedToken.role === "ADMIN";
      this.SocketService.connect(decodedToken.userId);
      this.SocketService.on('notification', (data) => {
        this.notification.set(data.message);
        this.loadTasks();
        const taskId = this.expandedTaskId();
        if(taskId!==null){
          this.loadSubtasksOfTask(taskId);
        }
        setTimeout(() => { this.notification.set('');}, 4000);
      });
    }
    this.loadTasks();
  }

  loadTasks() {
    this.taskService.getTasks().subscribe({
      next: (tasks:Task[]) => {
        this.tasks.set(tasks);
      },
      error: (err) => console.error('Σφάλμα', err)
    });
  }

  AddTask() {
    this.taskService.addTask(this.newTaskTitle, this.newTaskDescription).subscribe({
      next: (newTask:Task) => {
        this.tasks.update(tasks=>[...tasks,newTask])
        this.newTaskTitle = '';
        this.newTaskDescription = '';
      },
      error: (err) => console.error(err)
    });
  }

  onEditTask(task: Task) {
    this.editingTask.set(task);
    this.editTaskForm = {title:task.title, description:task.description};
  }

  onSaveEdit() {
    const task = this.editingTask();
    if(!task)return;
    this.taskService.updateTask(task.id,this.editTaskForm.title, this.editTaskForm.description).subscribe({
      next: () => {
        this.editingTask.set(null);
      },
      error: (err) => console.error(err)
    });
  }

  onCancelEdit() {
    this.editingTask.set(null);
  }

  onDeleteTask(task: any) {
    this.taskService.deleteTask(task.id).subscribe({
      next: () => {},
      error: (err) => console.error(err)
    });
  }

  onToggleComplete(task:Task) {
    this.taskService.toggleTask(task.id).subscribe({
      next: () => {},
      error: (err) => console.error(err)
    });
  }

  // ── Inline Subtasks ──
  onToggleSubtasks(task:Task) {
    const currentId = this.expandedTaskId();
    if(currentId === task.id){
      this.expandedTaskId.set(null);
    }else{
      this.expandedTaskId.set(task.id);
      this.loadSubtasksOfTask(task.id);
    }
    this.newSubtaskTitle = '';
    this.newSubTaskDescription = '';
    this.editingSubtask.set(null);
  }

  loadSubtasksOfTask(taskId: number) {
    this.taskService.getsubTasks(taskId).subscribe({
      next: (subtasks: Subtask[]) => {
        this.subtasksMap.update(map=>({...map,[taskId]:subtasks}))
      },
      error: (err) => console.error(err)
    });
  }

  onAddSubtask(taskId: number) {
    if (!this.newSubtaskTitle.trim()) return;
    this.taskService.addsubTask(taskId, this.newSubtaskTitle, this.newSubTaskDescription).subscribe({
      next: (newSubtask:Subtask) => {
        this.loadSubtasksOfTask(taskId);
        this.loadTasks();
        this.newSubtaskTitle = '';
        this.newSubTaskDescription = '';
      },
      error: (err) => console.error(err)
    });
  }

  onDeleteSubtask(subtaskId: number) {
    const taskId = this.expandedTaskId();
    if (taskId===null) return;
    this.taskService.deleteSubTask(taskId, subtaskId).subscribe({
      next: () => {
        this.loadSubtasksOfTask(taskId);
        this.loadTasks();
      },
      error: (err) => console.error(err)
    });
  }

  onToggleCompleteSub(subtask: Subtask) {
    const taskId = this.expandedTaskId();
    if (taskId===null) return;
    this.taskService.toggleSubtask(taskId, subtask.id).subscribe({
      next: () => {
        this.loadSubtasksOfTask(taskId);
      },
      error: (err) => console.error(err)
    });
  }

  onEditSubtask(taskId: number, subtask: Subtask) {
    this.editingSubtask.set({taskId, subtask});
    this.editSubtaskForm = {title:subtask.title, description:subtask.description};
  }

  onSaveSubtaskEdit() {
    const edit = this.editingSubtask();
    if(!edit)return;
    const {taskId,subtask} = edit;
      this.taskService.updateSubtask(taskId, subtask.id, this.editSubtaskForm.title,this.editSubtaskForm.description).subscribe({
      next: () => {
      this.loadSubtasksOfTask(taskId);
      this.editingSubtask.set(null);
      },
      error: (err) => console.error(err)
    });
  }

  onCancelSubtaskEdit() {
    this.editingSubtask.set(null);
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