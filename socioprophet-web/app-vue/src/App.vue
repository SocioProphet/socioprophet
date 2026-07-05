<script setup lang="ts">
import { useAuth } from "./stores/auth";
import { useRouter } from "vue-router";
import AppLauncher from "./components/AppLauncher.vue";
const auth = useAuth();
const router = useRouter();
const logout = async () => { await auth.signOut(); router.push("/login"); };
</script>

<template>
  <nav class="nav" v-if="auth.user">
    <strong>SourceOS Builder</strong>
    <router-link to="/builder">Build</router-link>
    <router-link to="/builds">My builds</router-link>
    <router-link v-if="auth.tier === 'premium'" to="/fleet">Fleet</router-link>
    <router-link to="/mail">Mail</router-link>
    <span class="sp"></span>
    <router-link to="/ai-studio" class="aistudio">✦ AI Studio</router-link>
    <AppLauncher />
    <span class="pill">{{ auth.tier }} tier</span>
    <span class="muted">{{ auth.user?.email }}</span>
    <button class="btn alt" @click="logout">Sign out</button>
  </nav>
  <main class="wrap">
    <router-view v-if="auth.ready" />
    <p v-else class="muted">Loading…</p>
  </main>
</template>
