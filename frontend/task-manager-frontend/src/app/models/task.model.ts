export interface Task {
    id:number; 
    user_id: number;
    title:string; 
    description:string;
    is_completed: 0|1;
    created_at:string; 
    updated_at:string;
}

export interface Subtask{ 
    id:number;
    task_id:number;
    user_id:number;
    title:string;
    description:string;
    is_completed: 0|1;
    created_at:string
}

export interface Log{
    id:number; 
    user_id: number; 
    action:string; 
    activity_type: 'AUTH' | 'CRUD' | 'ADMIN';
    created_at:string;
}

export interface User{
    id:number;
    username: string; 
    email:string;
    role: 'USER' | 'ADMIN';
    created_at: string;
}

export interface DecodedToken{
    userId:number; 
    username:string; 
    role: 'USER' | 'ADMIN';
}

export interface SocketNotification{
    message:string; 
    type:'succes' | 'error' | 'info';
}