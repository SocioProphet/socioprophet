<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuth } from "../stores/auth";

const auth = useAuth();
const router = useRouter();
const email = ref(""); const pw = ref(""); const err = ref(""); const busy = ref(false);

const go = () => router.push("/");
const google = async () => { err.value=""; busy.value=true; try { await auth.signInGoogle(); go(); } catch(e:any){ err.value=e.message; } finally { busy.value=false; } };
const signin = async () => { err.value=""; busy.value=true; try { await auth.signInEmail(email.value, pw.value); go(); } catch(e:any){ err.value=e.message; } finally { busy.value=false; } };
const register = async () => { err.value=""; busy.value=true; try { await auth.registerEmail(email.value, pw.value); go(); } catch(e:any){ err.value=e.message; } finally { busy.value=false; } };
</script>

<template>
  <div class="card" style="max-width:420px;margin:48px auto;">
    <h2>Sign in to build SourceOS</h2>
    <p class="muted">Compose your own image from a SourceOS flavor and we'll build it for you.</p>
    <button class="btn" style="width:100%;margin:8px 0" :disabled="busy" @click="google">Continue with Google</button>
    <label for="login-email">Email</label><input id="login-email" v-model="email" type="email" autocomplete="email" />
    <label for="login-pw">Password</label><input id="login-pw" v-model="pw" type="password" autocomplete="current-password" />
    <div class="row" style="margin-top:14px">
      <button class="btn alt" :disabled="busy" @click="signin">Sign in</button>
      <button class="btn alt" :disabled="busy" @click="register">Create account</button>
    </div>
    <p v-if="err" class="status-error" style="margin-top:12px">{{ err }}</p>
  </div>
</template>
