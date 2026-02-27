import { request } from '@/lib/request'

export interface UserInfo {
    id: number;
    username: string;
    email: string;
    isSuperuser?: boolean;
}

export interface AuthInfoResponse {
    user: UserInfo;
    permissions: string[];
}

export const authApi = {
    info() {
        return request<AuthInfoResponse>('/api/auth/info', {
            method: 'GET'
        })
    }
}
