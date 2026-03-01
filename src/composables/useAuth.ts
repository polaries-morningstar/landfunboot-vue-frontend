import { ref, computed } from 'vue'
import { authApi, type UserInfo } from '@/api/auth'
import { userApi } from '@/api/user'

// Global state
const user = ref<UserInfo | null>(null)
const permissions = ref<Set<string>>(new Set())
const isLoading = ref(false)
const initialized = ref(false)

export function useAuth() {
    const fetchUserInfo = async () => {
        if (!localStorage.getItem('token')) {
            clearAuth()
            return false
        }

        try {
            isLoading.value = true
            const res = await authApi.info()
            permissions.value = new Set(res.permissions || [])
            const selfUser = await userApi.getSelf()
            user.value = {
                id: selfUser.id,
                username: selfUser.username,
                email: selfUser.email,
                isSuperuser: selfUser.superuser
            }
            initialized.value = true
            return true
        } catch (e) {
            console.error('Failed to fetch user info:', e)
            clearAuth()
            return false
        } finally {
            isLoading.value = false
        }
    }

    const clearAuth = () => {
        user.value = null
        permissions.value.clear()
        initialized.value = false
        localStorage.removeItem('token')
    }

    const hasPermission = (permission?: string) => {
        if (!permission) return true // If no permission required, always allow

        // Superadmin bypass
        if (user.value?.isSuperuser) return true;

        // Admin wildcard or exact match
        return permissions.value.has('*:*:*') || permissions.value.has(permission)
    }

    return {
        user: computed(() => user.value),
        permissions: computed(() => Array.from(permissions.value)),
        isLoading: computed(() => isLoading.value),
        initialized: computed(() => initialized.value),
        fetchUserInfo,
        clearAuth,
        hasPermission
    }
}
