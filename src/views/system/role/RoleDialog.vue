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
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { roleApi, type Role } from '@/api/role'
import { deptApi, type Dept } from '@/api/dept'
import { menuApi, type Menu } from '@/api/menu'
import { useToast } from '@/components/ui/toast/use-toast'

const props = defineProps<{
  open: boolean
  role?: Role | null
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'success'): void
}>()

const { toast } = useToast()
const loading = ref(false)

const formSchema = toTypedSchema(
  z.object({
    id: z.number().optional(),
    name: z.string().min(2, '角色名称至少2个字符'),
    code: z.string().min(2, '角色代码至少2个字符'),
    description: z.string().optional(),
    dataScope: z.enum(['ALL', 'DEPT_SAME', 'DEPT_RECURSIVE', 'SELF', 'DEPT_CUSTOM']),
    deptIds: z.array(z.number()).default([]),
    menuIds: z.array(z.number()).default([]),
  })
)

const form = useForm({
  validationSchema: formSchema,
  initialValues: {
    dataScope: 'SELF',
    deptIds: [],
    menuIds: [],
  }
})


const depts = ref<(Dept & { level: number })[]>([])
const menus = ref<(Menu & { level: number })[]>([])

const fetchMenus = async () => {
  if (menus.value.length > 0) return
  try {
    const res = await menuApi.tree()
    const list: (Menu & { level: number })[] = []
    const traverse = (items: Menu[], level = 0) => {
      items.forEach(item => {
        list.push({ ...item, level })
        if (item.children) traverse(item.children, level + 1)
      })
    }
    traverse(res)
    menus.value = list
  } catch (e) {}
}

const fetchDepts = async () => {
  if (depts.value.length > 0) return
  try {
    const res = await deptApi.tree()
    const list: (Dept & { level: number })[] = []
    const traverse = (items: Dept[], level = 0) => {
      items.forEach(item => {
        list.push({ ...item, level })
        if (item.children) traverse(item.children, level + 1)
      })
    }
    traverse(res)
    depts.value = list
  } catch (e) {}
}

const fetchRoleDetails = async (id: number) => {
  try {
    const res = await roleApi.get(id)
    form.setValues({
      id: res.id,
      name: res.name,
      code: res.code,
      description: res.description || '',
      dataScope: res.dataScope as any,
      deptIds: res.deptIds || [], 
      menuIds: res.menuIds || (res as any).menus?.map((m: any) => m.id) || []
    })
    
    // If backend doesn't return deptIds directly but we need to map from depts relationship (if included)
    // But `Role` interface now has `deptIds`. Let's assume get() returns populated object.
    // If not, we might need a separate endpoint or ensuring fetcher includes it.
    // For now, let's assume get(id) is sufficient or we rely on RoleFetcher being updated in backend to include ids.
    // NOTE: I haven't updated RoleFetcher in backend to explicitly include deptIds scalar.
    // But JSqlClient default fetcher usually includes scalars. `deptIds` is NOT a column, it's a derived property or input property.
    // The relationship is `depts`.
    // So `res.depts` might be present.
    // Let's add safely:
    // deptIds: res.deptIds || (res as any).depts?.map((d: any) => d.id) || []
    
    const ids = res.deptIds || (res as any).depts?.map((d: any) => d.id) || []
    form.setFieldValue('deptIds', ids)

    const mIds = res.menuIds || (res as any).menus?.map((m: any) => m.id) || []
    form.setFieldValue('menuIds', mIds)
    
    
  } catch (e) {
      console.error(e)
  }
}

watch(() => props.open, (newVal) => {
  if (newVal) {
    fetchDepts()
    fetchMenus()
    if (props.role) {
      // Fetch fresh details with deptIds
      fetchRoleDetails(props.role.id)
    } else {
      form.resetForm({
          values: {
              name: '',
              code: '',
              description: '',
              dataScope: 'SELF',
              deptIds: [],
              menuIds: []
          }
      })
    }
  }
})

const onFormSubmit = form.handleSubmit(async (values) => {
  loading.value = true
  try {
    await roleApi.save(values as any)
    toast({
      title: props.role ? '修改成功' : '添加成功',
      description: `角色 ${values.name} 已${props.role ? '更新' : '添加'}`,
    })
    emit('success')
    emit('update:open', false)
  } catch (error: any) {
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>{{ role ? '编辑角色' : '添加角色' }}</DialogTitle>
        <DialogDescription>
          填写角色基本信息及数据权限范围
        </DialogDescription>
      </DialogHeader>
      
      <form @submit="onFormSubmit" class="space-y-4 py-4">
        <FormField v-slot="{ componentField }" name="name">
          <FormItem>
            <FormLabel>角色名称</FormLabel>
            <FormControl>
              <Input placeholder="请输入角色名称" v-bind="componentField" />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <FormField v-slot="{ componentField }" name="code">
          <FormItem>
            <FormLabel>角色代码</FormLabel>
            <FormControl>
              <Input placeholder="ROLE_ADMIN" v-bind="componentField" />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <FormField v-slot="{ value, handleChange }" name="dataScope">
          <FormItem>
            <FormLabel>数据范围</FormLabel>
            <Select :model-value="value" @update:model-value="handleChange">
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="选择数据范围" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="ALL">所有数据</SelectItem>
                <SelectItem value="DEPT_SAME">本部门数据</SelectItem>
                <SelectItem value="DEPT_RECURSIVE">本部门及子部门数据</SelectItem>
                <SelectItem value="SELF">仅本人数据</SelectItem>
                <SelectItem value="DEPT_CUSTOM">自定义部门</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        </FormField>

        <FormField v-if="form.values.dataScope === 'DEPT_CUSTOM'" name="deptIds">
            <FormItem>
              <FormLabel>数据权限部门</FormLabel>
              <div class="border rounded-md p-4 max-h-[300px] overflow-y-auto space-y-2">
                 <div v-if="depts.length === 0" class="text-sm text-muted-foreground text-center">正在加载部门...</div>
                 <div v-for="dept in depts" :key="dept.id" class="flex items-center space-x-2" :style="{ paddingLeft: `${dept.level * 20}px` }">
                     <Checkbox 
                         :id="`dept-${dept.id}`"
                         :checked="form.values.deptIds?.includes(dept.id)"
                         @update:checked="(checked: boolean) => {
                             const current = [...(form.values.deptIds || [])]
                             if (checked) {
                                 form.setFieldValue('deptIds', [...current, dept.id])
                             } else {
                                 form.setFieldValue('deptIds', current.filter(id => id !== dept.id))
                             }
                         }"
                     />
                     <label :for="`dept-${dept.id}`" class="text-sm cursor-pointer select-none">{{ dept.name }}</label>
                 </div>
              </div>
              <FormMessage />
            </FormItem>
        </FormField>

        <FormField name="menuIds">
            <FormItem>
              <FormLabel>菜单权限</FormLabel>
              <div class="border rounded-md p-4 max-h-[400px] overflow-y-auto space-y-2">
                 <div v-if="menus.length === 0" class="text-sm text-muted-foreground text-center">正在加载菜单...</div>
                 <div v-for="menu in menus" :key="menu.id" class="flex items-center space-x-2" :style="{ paddingLeft: `${menu.level * 20}px` }">
                     <Checkbox 
                         :id="`menu-${menu.id}`"
                         :checked="form.values.menuIds?.includes(menu.id)"
                         @update:checked="(checked: boolean) => {
                             const current = [...(form.values.menuIds || [])]
                             if (checked) {
                                 form.setFieldValue('menuIds', [...current, menu.id])
                             } else {
                                 form.setFieldValue('menuIds', current.filter(id => id !== menu.id))
                             }
                         }"
                     />
                     <label :for="`menu-${menu.id}`" class="text-sm cursor-pointer select-none flex items-center">
                        <span v-if="menu.type === 'DIR'" class="text-muted-foreground mr-1">[目录]</span>
                        <span v-else-if="menu.type === 'BUTTON'" class="text-green-600 mr-1">[按钮]</span>
                        {{ menu.name }}
                     </label>
                 </div>
              </div>
              <FormMessage />
            </FormItem>
        </FormField>

        <FormField v-slot="{ componentField }" name="description">
          <FormItem>
            <FormLabel>描述</FormLabel>
            <FormControl>
              <Textarea placeholder="请输入角色描述" v-bind="componentField" />
            </FormControl>
            <FormMessage />
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
