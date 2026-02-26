<script setup lang="ts">
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast/use-toast'
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const { toast } = useToast()
const router = useRouter()

const formSchema = toTypedSchema(
  z.object({
    email: z.string().email({ message: '请输入有效的邮箱地址' }).min(2, { message: '邮箱长度至少2位' }),
    password: z.string().min(1, { message: '请输入密码' }),
  })
)

const form = useForm({
  validationSchema: formSchema,
})

const isLoading = ref(false)

const onSubmit = form.handleSubmit(async (values) => {
  isLoading.value = true
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })

    if (!response.ok) {
        let errorMsg = '登录失败'
        try {
            const data = await response.json()
            errorMsg = data.msg || data.message || errorMsg
        } catch (e) {}
        throw new Error(errorMsg)
    }

    const data = await response.json()
    // data.data is the result map from backend
    const token = data.data?.token
    if (token) {
        localStorage.setItem('token', token)
        toast({
          title: '登录成功',
          description: '即将进入系统...',
        })
        // Redirect
        setTimeout(() => {
            router.push('/')
        }, 500)
    } else {
         throw new Error('未获取到令牌')
    }

  } catch (error: any) {
    toast({
      title: '错误',
      description: error.message,
      variant: 'destructive',
    })
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <div class="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
    <Card class="w-full max-w-sm">
      <CardHeader>
        <CardTitle class="text-2xl">系统登录</CardTitle>
        <CardDescription>
          请输入您的账号密码以继续
        </CardDescription>
      </CardHeader>
      <CardContent class="grid gap-4">
        <form @submit="onSubmit" class="grid gap-4">
          <FormField v-slot="{ componentField }" name="email">
            <FormItem>
              <FormLabel>邮箱</FormLabel>
              <FormControl>
                <Input type="text" placeholder="admin@example.com" v-bind="componentField" />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>
          
          <FormField v-slot="{ componentField }" name="password">
            <FormItem>
              <FormLabel>密码</FormLabel>
              <FormControl>
                <Input type="password" placeholder="******" v-bind="componentField" />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>
          
          <Button type="submit" class="w-full" :disabled="isLoading">
            {{ isLoading ? '登录中...' : '登录' }}
          </Button>
        </form>
      </CardContent>
    </Card>
  </div>
</template>
