import { createRouter, createWebHistory } from 'vue-router'
import Login from '@/views/Login.vue'
import { useAuth } from '@/composables/useAuth'

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
            redirect: '/welcome',
            children: [
                {
                    path: 'welcome',
                    name: 'Welcome',
                    component: () => import('@/views/Welcome.vue'),
                    // No permission required — all authenticated users can see this
                },
                {
                    path: 'system/user',
                    name: 'SystemUser',
                    component: () => import('@/views/system/user/index.vue'),
                    meta: { permission: 'sys:user:list' }
                },
                {
                    path: 'system/role',
                    name: 'SystemRole',
                    component: () => import('@/views/system/role/index.vue'),
                    meta: { permission: 'sys:role:list' }
                },
                {
                    path: 'system/dept',
                    name: 'SystemDept',
                    component: () => import('@/views/system/dept/index.vue'),
                    meta: { permission: 'sys:dept:list' }
                },
                {
                    path: 'system/menu',
                    name: 'SystemMenu',
                    component: () => import('@/views/system/menu/index.vue'),
                    meta: { permission: 'sys:menu:list' }
                },
                {
                    path: 'monitor',
                    name: 'Monitor',
                    component: () => import('@/views/monitor/index.vue'),
                    meta: { permission: 'sys:monitor:info' }
                },
                {
                    path: 'monitor/online',
                    name: 'MonitorOnline',
                    component: () => import('@/views/monitor/online.vue'),
                    meta: { permission: 'sys:user:online' }
                }
            ]
        }
    ]
})

router.beforeEach(async (to, _from, next) => {
    const token = localStorage.getItem('token')
    const { initialized, fetchUserInfo, hasPermission } = useAuth()

    // Unauthenticated
    if (!token && to.name !== 'login') {
        return next({ name: 'login' })
    }

    // Authenticated & Not Initialized
    if (token && !initialized.value && to.name !== 'login') {
        const success = await fetchUserInfo()
        if (!success) {
            return next({ name: 'login' }) // Token invalid or expired
        }
    }

    // Permission check — redirect to welcome page (not root) to break the redirect loop
    if (to.meta.permission) {
        if (!hasPermission(to.meta.permission as string)) {
            console.warn(`Access Denied to ${to.path} (Requires: ${to.meta.permission})`)
            return next({ name: 'Welcome' })
        }
    }

    // Prevent logged-in users from seeing login page repeatedly
    if (token && to.name === 'login') {
        return next({ name: 'Welcome' })
    }

    next()
})

export default router
