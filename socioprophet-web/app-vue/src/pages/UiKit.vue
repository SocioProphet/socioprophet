<template>
  <!-- UI_PRIMITIVES_DEMO -->
  <div style="padding: 18px; max-width: 1100px;">
    <div style="display:flex; align-items:center; justify-content:space-between; gap:12px;">
      <div>
        <div style="font-weight:800; font-size:18px;">UI Kit</div>
        <div style="opacity:0.75; font-size:13px; margin-top:4px;">
          Canonical building blocks + styling reference (storybook-lite).
        </div>
      </div>
      <div style="display:flex; gap:10px;">
        <SpButton data-canary="sp" variant="ghost" size="md">Ghost</SpButton>
        <SpButton data-canary="sp" variant="primary" size="md">Primary</SpButton>
        <SpButton data-canary="sp" variant="danger" size="md">Danger</SpButton>
      </div>
    </div>

    <div style="display:grid; grid-template-columns: 1.2fr 0.8fr; gap:14px; margin-top:16px;">
      <UiCard title="Cards">
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
          <UiCard title="Nested card">
            <div style="opacity:0.85; font-size:13px; line-height:1.35;">
              This is our baseline surface. We’ll reuse it everywhere to avoid one-off CSS.
            </div>
            <template #footer>
              <div style="display:flex; gap:10px; align-items:center;">
                <UiBadge tone="muted">muted</UiBadge>
                <UiBadge tone="accent">accent</UiBadge>
                <UiBadge tone="warn">warn</UiBadge>
              </div>
            </template>
          </UiCard>
          <UiCard title="Empty state">
            <div style="opacity:0.70; font-size:13px;">
              When a page is “empty,” it should still look intentional.
            </div>
          </UiCard>
        </div>
      </UiCard>

      <UiCard title="Fields">
        <UiField label="Search" hint="We’ll standardize these across Builder/Entities/Reader." placeholder="Type to filter…" v-model="q" />
        <div style="margin-top:12px; display:flex; gap:10px; flex-wrap:wrap;">
          <SpButton variant="primary" size="sm">Run</SpButton>
          <SpButton variant="ghost" size="sm">Save</SpButton>
          <SpButton variant="ghost" size="sm">Export</SpButton>
        </div>
        <div style="margin-top:12px; opacity:0.75; font-size:12px;">
          Model value: <span style="font-family: ui-monospace, SFMono-Regular, Menlo, monospace;">{{ q }}</span>
        </div>
      </UiCard>
    </div>

    <UiCard title="Design tokens (current :root variables)" style="margin-top:14px;">
      <div style="display:flex; gap:10px; flex-wrap:wrap;">
        <div v-for="t in tokens" :key="t.name" style="display:flex; align-items:center; gap:8px; padding:8px 10px; border:1px solid rgba(255,255,255,0.10); border-radius:12px; background:rgba(255,255,255,0.03);">
          <div :style="{ width:'16px', height:'16px', borderRadius:'6px', background:`var(${t.name})`, border:'1px solid rgba(255,255,255,0.12)' }"></div>
          <div style="font-size:12px; opacity:0.85; font-family: ui-monospace, SFMono-Regular, Menlo, monospace;">{{ t.name }}</div>
        </div>
      </div>
    </UiCard>
  </div>
</template>

<script setup lang="ts">
import SpButton from '../components/ui/SpButton.vue'
import SpCard from '../components/ui/SpCard.vue'
import SpBadge from '../components/ui/SpBadge.vue'

import { ref } from 'vue'
import UiCard from '../components/ui/UiCard.vue'
import UiBadge from '../components/ui/UiBadge.vue'
import UiField from '../components/ui/UiField.vue'

const q = ref('')
const tokens = [
  { name: '--bg0' },
  { name: '--bg1' },
  { name: '--ink' },
  { name: '--muted' },
  { name: '--paper' },
  { name: '--paperBorder' },
  { name: '--accent' },
]
</script>
