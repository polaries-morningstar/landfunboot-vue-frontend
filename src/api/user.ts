import { request } from '@/lib/request'

export interface User {
    id: number;
    username: string;
    email: string;
    dept?: {
        id: number;
        name: string;
    };
    createdTime: string;
    active: boolean;
    roles?: {
        id: number;
        name: string;
    }[];
}

export interface PageResult<T> {
    total: number;
    rows: T[];
}

export interface BasePageQuery {
    page?: number;
    size?: number;
    sort?: string;
}

export const userApi = {
    page: (query: BasePageQuery) => {
        return request<PageResult<User>>('/api/sys/user', {
            method: 'GET',
            params: query as any
        })
    },
    save: (data: Partial<User> & { roleIds?: number[]; deptId?: number }) => {
        if (data.id) {
            return request<number>('/api/sys/user', {
                method: 'PUT',
                body: JSON.stringify(data)
            })
        } else {
            return request<number>('/api/sys/user', {
                method: 'POST',
                body: JSON.stringify(data)
            })
        }
    },
    delete: (id: number) => {
        return request<void>(`/api/sys/user/${id}`, {
            method: 'DELETE'
        })
    }
}
