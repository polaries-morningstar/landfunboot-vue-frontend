import { createRouter, createWebHistory } from 'vue-router'
import Login from '@/views/Login.vue'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/login',
            name: 'login',
            component: Login
        },
        {
            path: '/',
            component: () => import('@/components/layout/MainLayout.vue'),
            redirect: '/system/user',
            children: [
                {
                    path: 'system/user',
                    name: 'SystemUser',
                    component: () => import('@/views/system/user/index.vue')
                },
                {
                    path: 'system/role',
                    name: 'SystemRole',
                    component: () => import('@/views/system/role/index.vue')
                },
                {
                    path: 'system/dept',
                    name: 'SystemDept',
                    component: () => import('@/views/system/dept/index.vue')
                },
                {
                    path: 'system/menu',
                    name: 'SystemMenu',
                    component: () => import('@/views/system/menu/index.vue')
                }
            ]
        }
    ]
})

export default router
