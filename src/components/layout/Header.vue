<script setup lang="ts">
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useRouter } from 'vue-router'

// Mock User for now, later fetch from store/api
const user = {
    username: 'Admin',
    email: 'admin@example.com',
    initials: 'AD'
}

const router = useRouter()
const logout = () => {
    localStorage.removeItem('token')
    router.push('/login')
}
</script>

<template>
  <header class="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
    <!-- Mobile Menu Trigger (TODO) -->
    <div class="flex items-center gap-2 md:hidden">
       <!-- Icon -->
       <span class="font-bold">Landfun Boot</span>
    </div>
    
    <div class="ml-auto flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <div class="flex items-center gap-2 cursor-pointer">
              <span class="text-sm font-medium hidden md:block">{{ user.username }}</span>
              <Avatar>
                <AvatarImage src="" />
                <AvatarFallback>{{ user.initials }}</AvatarFallback>
              </Avatar>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>我的账户</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>个人设置</DropdownMenuItem>
          <DropdownMenuItem @click="logout" class="text-red-500">退出登录</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </header>
</template>
