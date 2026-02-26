<script setup lang="ts">
import { ref, watch } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
//  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { userApi, type User } from '@/api/user'
import { roleApi, type Role } from '@/api/role'
import { deptApi, type Dept } from '@/api/dept'
import { useToast } from '@/components/ui/toast/use-toast'

const props = defineProps<{
  open: boolean
  user?: User | null
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'success'): void
}>()

const { toast } = useToast()
const roles = ref<Role[]>([])
const depts = ref<Dept[]>([])
const loading = ref(false)

const formSchema = toTypedSchema(
  z.object({
    id: z.number().optional(),
    username: z.string().min(2, '用户名至少2个字符'),
    email: z.string().email('请输入有效的邮箱地址'),
    password: z.string().min(6, '密码至少6个字符').optional().or(z.literal('')),
    active: z.boolean().default(true),
    deptId: z.number().optional(),
    roleIds: z.array(z.number()).default([]),
  })
)

const form = useForm({
  validationSchema: formSchema,
  initialValues: {
    active: true,
    roleIds: [],
  }
})

const fetchOptions = async () => {
    try {
        const [rolesRes, deptsRes] = await Promise.all([
            roleApi.all(),
            deptApi.tree()
        ])
        roles.value = rolesRes
        // Flatten depts for simple select
        const flattenDepts: Dept[] = []
        const traverse = (list: Dept[], level = 0) => {
            list.forEach(item => {
                flattenDepts.push({ ...item, name: '  '.repeat(level) + item.name })
                if (item.children) traverse(item.children, level + 1)
            })
        }
        traverse(deptsRes)
        depts.value = flattenDepts
    } catch (e) {
        console.error('Failed to fetch options', e)
    }
}

watch(() => props.open, (newVal) => {
  if (newVal) {
    fetchOptions()
    if (props.user) {
      form.setValues({
          id: props.user.id,
          username: props.user.username,
          email: props.user.email,
          active: props.user.active,
          deptId: props.user.dept?.id,
          roleIds: props.user.roles?.map(r => r.id) || [],
          password: '' // Don't set password for edit
      })
    } else {
      form.resetForm({
          values: {
              username: '',
              email: '',
              password: '',
              active: true,
              roleIds: [],
              deptId: undefined
          }
      })
    }
  }
})

// onSubmit handler
const onFormSubmit = form.handleSubmit(async (values) => {
  loading.value = true
  try {
    // If edit and password is empty, remove it from payload
    const payload = { ...values }
    if (payload.id && !payload.password) {
        delete payload.password
    }
    
    await userApi.save(payload as any)
    toast({
      title: props.user ? '修改成功' : '添加成功',
      description: `用户 ${values.username} 已${props.user ? '更新' : '添加'}`,
    })
    emit('success')
    emit('update:open', false)
  } catch (error: any) {
     // Error handled by request interceptor usually
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>{{ user ? '编辑用户' : '添加用户' }}</DialogTitle>
        <DialogDescription>
          填写用户信息及权限配置
        </DialogDescription>
      </DialogHeader>
      
      <form @submit="onFormSubmit" class="space-y-4 py-4">
        <FormField v-slot="{ componentField }" name="username">
          <FormItem>
            <FormLabel>用户名</FormLabel>
            <FormControl>
              <Input placeholder="请输入用户名" v-bind="componentField" />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <FormField v-slot="{ componentField }" name="email">
          <FormItem>
            <FormLabel>邮箱</FormLabel>
            <FormControl>
              <Input placeholder="admin@example.com" v-bind="componentField" />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <FormField v-slot="{ componentField }" name="password">
          <FormItem>
            <FormLabel>密码 {{ user ? '(不修改请留空)' : '' }}</FormLabel>
            <FormControl>
              <Input type="password" placeholder="******" v-bind="componentField" />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <FormField v-slot="{ value, handleChange }" name="deptId">
          <FormItem>
            <FormLabel>部门</FormLabel>
            <Select :model-value="value?.toString()" @update:model-value="v => handleChange(Number(v))">
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="选择部门" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem v-for="dept in depts" :key="dept.id" :value="dept.id.toString()">
                  <pre class="m-0 font-sans">{{ dept.name }}</pre>
                </SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        </FormField>

        <FormField name="roleIds">
          <FormItem>
            <FormLabel>角色</FormLabel>
            <div class="grid grid-cols-2 gap-2 mt-2">
                <div v-for="role in roles" :key="role.id" class="flex items-center space-x-2">
                    <Checkbox 
                        :id="'role-' + role.id" 
                        :checked="form.values.roleIds?.includes(role.id)"
                        @update:checked="(checked: boolean) => {
                            const current = [...(form.values.roleIds || [])]
                            if (checked) {
                                form.setFieldValue('roleIds', [...current, role.id])
                            } else {
                                form.setFieldValue('roleIds', current.filter(id => id !== role.id))
                            }
                        }"
                    />
                    <label :for="'role-' + role.id" class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        {{ role.name }}
                    </label>
                </div>
            </div>
            <FormMessage />
          </FormItem>
        </FormField>

        <FormField v-slot="{ value, handleChange }" name="active">
          <FormItem class="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
            <div class="space-y-0.5">
              <FormLabel>账户启用状态</FormLabel>
              <div class="text-[0.8rem] text-muted-foreground">
                禁用后该账户将无法登录系统
              </div>
            </div>
            <FormControl>
              <Switch :checked="value" @update:checked="handleChange" />
            </FormControl>
          </FormItem>
        </FormField>

        <DialogFooter>
          <Button type="button" variant="outline" @click="emit('update:open', false)">
            取消
          </Button>
          <Button type="submit" :disabled="loading">
            {{ loading ? '保存中...' : '保存' }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
