import { AuthService } from './../../services/auth';
import { Component,inject,OnInit,ChangeDetectorRef,ViewEncapsulation } from '@angular/core';
import {TaskService} from '../../services/task';
import {Router} from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-logs',
  imports: [CommonModule,FormsModule],
  templateUrl: './logs.html',
  styleUrl: './logs.css',
  encapsulation: ViewEncapsulation.None
})

export class Logs implements OnInit {
  isAdmin=false;
  logs: any[] = [];
  username = ' ';

  private taskService = inject(TaskService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);
  router = inject(Router);

  ngOnInit(){
    const token = localStorage.getItem('accessToken');
    if(token){
      const decoded = JSON.parse(atob(token.split('.')[1]));
      this.username = decoded.username;
      this.isAdmin = decoded.role === "ADMIN";
    }
    this.loadLogs();
  }

  loadLogs(){
    this.taskService.getLogs().subscribe({
      next:(response:any)=>{
        this.logs = [...response];
        this.cdr.detectChanges();
      },
      error:(err)=>{
        console.error(err);
      }
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
}
