import { Routes } from '@angular/router';
import {Login} from './pages/login/login';
import {Tasks} from './pages/tasks/tasks';
import {Logs} from './pages/logs/logs';
import {Register} from './pages/register/register';
import {Admin} from './pages/admin/admin';

export const routes: Routes = [
    {path:'',redirectTo:'login',pathMatch:'full'},
    {path:'login',component:Login},
    {path:'tasks',component:Tasks},
    {path:'logs',component:Logs},
    {path:'register',component:Register},
    {path:'admin',component:Admin}
];
