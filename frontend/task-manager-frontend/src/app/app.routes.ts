import { Routes } from '@angular/router';

export const routes: Routes = [
    {path:'',redirectTo:'login',pathMatch:'full'},
    {path:'login',loadComponent:()=>import('./pages/login/login').then(m=>m.Login)},
    {path:'tasks',loadComponent:()=>import('./pages/tasks/tasks').then(m=>m.Tasks)},
    {path:'logs',loadComponent:()=>import('./pages/logs/logs').then(m=>m.Logs)},
    {path:'register',loadComponent:()=>import('./pages/register/register').then(m=>m.Register)},
    {path:'admin',loadComponent:()=>import('./pages/admin/admin').then(m=>m.Admin)},
    {path:'oauth-callback',loadComponent:()=>import('./pages/oauth-callback/oauth-callback').then(m=>m.OauthCallbackComponent)},
    { path: '**', redirectTo: '/login' }
];
