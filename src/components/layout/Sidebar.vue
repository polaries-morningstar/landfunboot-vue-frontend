<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()

const menus = [
    {
        title: '系统管理',
        items: [
            { title: '用户管理', href: '/system/user' },
            { title: '角色管理', href: '/system/role' },
            { title: '部门管理', href: '/system/dept' },
            { title: '菜单管理', href: '/system/menu' },
        ]
    }
]
</script>

<template>
  <div class="hidden border-r bg-muted/40 md:block min-h-screen w-[220px] lg:w-[280px]">
    <div class="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
      <a href="/" class="flex items-center gap-2 font-semibold">
        <span class="">Landfun Boot</span>
      </a>
    </div>
    <div class="flex-1">
      <nav class="grid items-start px-2 text-sm font-medium lg:px-4 mt-4">
        <div v-for="group in menus" :key="group.title" class="mb-4">
            <h4 class="mb-2 px-4 text-xs font-semibold text-muted-foreground tracking-wider">
                {{ group.title }}
            </h4>
            <div class="grid gap-1">
                <router-link
                    v-for="item in group.items"
                    :key="item.href"
                    :to="item.href"
                    class="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                    :class="{ 'bg-muted text-primary': route.path === item.href }"
                >
                    {{ item.title }}
                </router-link>
            </div>
        </div>
      </nav>
    </div>
  </div>
</template>
