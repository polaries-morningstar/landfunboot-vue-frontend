import { useToast } from '@/components/ui/toast/use-toast'

const { toast } = useToast()

interface RequestOptions extends RequestInit {
    params?: Record<string, string | number | boolean | undefined>;
}

export async function request<T>(url: string, options: RequestOptions = {}): Promise<T> {
    const token = localStorage.getItem('token')

    const headers = new Headers(options.headers)
    if (token) {
        headers.set('Authorization', token)
    }
    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
        headers.set('Content-Type', 'application/json')
    }

    let finalUrl = url
    if (options.params) {
        const params = new URLSearchParams()
        Object.entries(options.params).forEach(([key, value]) => {
            if (value !== undefined) {
                params.append(key, String(value))
            }
        })
        const queryString = params.toString()
        if (queryString) {
            finalUrl += (url.includes('?') ? '&' : '?') + queryString
        }
    }

    try {
        const response = await fetch(finalUrl, {
            ...options,
            headers,
        })

        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem('token')
                window.location.href = '/login'
                throw new Error('Unauthorized')
            }
            let errorMsg = '请求失败'
            try {
                const data = await response.json()
                errorMsg = data.msg || data.message || errorMsg
            } catch (e) { }
            throw new Error(errorMsg)
        }

        const res = await response.json()
        // Backend standard: { code: 200, message: "...", data: ... }
        if (res.code !== 200) {
            throw new Error(res.message || 'Error')
        }
        return res.data as T
    } catch (error: any) {
        console.error('API Error:', error)
        toast({
            title: '错误',
            description: error.message,
            variant: 'destructive',
        })
        throw error
    }
}
