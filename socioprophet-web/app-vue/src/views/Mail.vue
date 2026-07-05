<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from "vue";
import { useMail } from "../stores/mail";
import type { MailView } from "../services/mailApi";

const mail = useMail();
const reply = ref("");
const replySending = ref(false);
const paletteQuery = ref("");
const composeTo = ref("");
const composeSubject = ref("");
const composeBody = ref("");
const composeSending = ref(false);

async function submitReply() {
  if (!reply.value.trim() || replySending.value) return;
  replySending.value = true;
  try {
    await mail.replyToCurrent(reply.value);
    reply.value = "";
  } catch { /* mail.error already set */ }
  finally { replySending.value = false; }
}

async function loadDraft() {
  const draft = await mail.draftReply("reply");
  if (draft) reply.value = draft;
}

function openCompose() {
  composeTo.value = ""; composeSubject.value = ""; composeBody.value = "";
  mail.composeOpen = true;
}

async function submitCompose() {
  if (composeSending.value) return;
  composeSending.value = true;
  try {
    const ok = await mail.sendNew({ to: composeTo.value, subject: composeSubject.value, body: composeBody.value });
    if (ok) mail.composeOpen = false;
  } finally { composeSending.value = false; }
}

const views: { key: MailView; label: string; icon: string }[] = [
  { key: "imbox", label: "Imbox", icon: "inbox" },
  { key: "feed", label: "The Feed", icon: "rss" },
  { key: "papertrail", label: "Paper Trail", icon: "receipt" },
];

const actions = [
  { id: "done", label: "Mark done", key: "E", run: () => mail.act("done") },
  { id: "replyLater", label: "Reply later", key: "R", run: () => mail.act("replyLater", { until: "later" }) },
  { id: "setAside", label: "Set aside", key: "S", run: () => mail.act("setAside") },
  { id: "snooze", label: "Snooze 3 days", key: "H", run: () => mail.act("snooze", { until: "+3d" }) },
  { id: "imbox", label: "Go to Imbox", key: "G I", run: () => mail.load("imbox") },
  { id: "feed", label: "Go to The Feed", key: "G F", run: () => mail.load("feed") },
  { id: "screener", label: "Open Screener", key: "G S", run: () => (mail.screenerOpen = true) },
];
const filteredActions = computed(() =>
  actions.filter((a) => a.label.toLowerCase().includes(paletteQuery.value.toLowerCase()))
);
function runAction(a: { run: () => void }) { a.run(); mail.paletteOpen = false; paletteQuery.value = ""; }

function onKey(e: KeyboardEvent) {
  const typing = (e.target as HTMLElement)?.tagName?.match(/INPUT|TEXTAREA/);
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); mail.paletteOpen = !mail.paletteOpen; return; }
  if (e.key === "Escape") { mail.paletteOpen = false; mail.screenerOpen = false; mail.composeOpen = false; return; }
  if (mail.paletteOpen || mail.composeOpen || typing) return;
  if (e.key === "j") mail.selectRelative(1);
  else if (e.key === "k") mail.selectRelative(-1);
  else if (e.key === "e") mail.act("done");
  else if (e.key === "r") mail.act("replyLater", { until: "later" });
  else if (e.key === "s") mail.act("setAside");
  else if (e.key === "c") openCompose();
}

onMounted(() => { mail.load("imbox"); mail.loadScreener(); window.addEventListener("keydown", onKey); });
onUnmounted(() => window.removeEventListener("keydown", onKey));
</script>

<template>
  <div class="mail">
    <aside class="rail">
      <button class="compose" @click="openCompose"><i class="ti ti-pencil"></i> Compose <span class="kbd">C</span></button>
      <button v-for="v in views" :key="v.key" class="navitem" :class="{ on: mail.view === v.key }" @click="mail.load(v.key)">
        <i class="ti" :class="'ti-' + v.icon"></i> {{ v.label }}
        <span v-if="v.key === 'imbox' && mail.unreadCount" class="count">{{ mail.unreadCount }}</span>
      </button>
      <button class="navitem" @click="mail.screenerOpen = true">
        <i class="ti ti-shield-half"></i> Screener
        <span v-if="mail.screener.length" class="badge">{{ mail.screener.length }}</span>
      </button>
      <div class="sep"></div>
      <div class="railhint">Split inbox</div>
      <button class="navitem"><i class="ti ti-star"></i> VIP</button>
      <button class="navitem"><i class="ti ti-users"></i> Team</button>
      <div class="foot"><i class="ti ti-lock"></i> on-device · no tracking</div>
    </aside>

    <section class="list">
      <header class="listhead"><span>{{ views.find((v) => v.key === mail.view)?.label }}</span>
        <span v-if="mail.replyLaterCount" class="muted">reply-later · {{ mail.replyLaterCount }}</span></header>
      <p v-if="mail.error" class="err">{{ mail.error }}</p>
      <p v-else-if="mail.loading" class="muted pad">Loading…</p>
      <p v-else-if="!mail.threads.length" class="muted pad">Nothing here. Inbox zero.</p>
      <div v-for="t in mail.threads" :key="t.id" class="row" :class="{ on: mail.current?.id === t.id, unread: t.unread }" @click="mail.select(t.id)">
        <div class="rowtop"><span class="from">{{ t.from }}</span><span class="ts">{{ t.ts }}</span></div>
        <div class="subj">{{ t.subject }} <i v-if="t.replyLaterAt" class="ti ti-clock later" :title="'reply later · ' + t.replyLaterAt"></i></div>
        <div class="snip">{{ t.snippet }}</div>
      </div>
    </section>

    <section class="read" v-if="mail.current">
      <header class="readhead">
        <div class="who"><div class="subj big">{{ mail.current.subject }}</div>
          <div class="muted">{{ mail.current.from }} · {{ mail.current.fromEmail }} · {{ mail.current.ts }}</div></div>
        <button class="act" title="reply later (R)" @click="mail.act('replyLater', { until: 'later' })"><i class="ti ti-clock"></i></button>
        <button class="act" title="set aside (S)" @click="mail.act('setAside')"><i class="ti ti-archive"></i></button>
        <button class="act ok" title="done (E)" @click="mail.act('done')"><i class="ti ti-check"></i></button>
      </header>
      <div v-if="mail.aiSummary" class="ai"><i class="ti ti-sparkles"></i> {{ mail.aiSummary }}</div>
      <div class="body"><p v-for="m in mail.current.messages" :key="m.id">{{ m.bodyText }}</p></div>
      <footer class="replybar">
        <input v-model="reply" placeholder="Reply…" :disabled="replySending" @keyup.enter="submitReply" />
        <button class="draft" title="AI draft" @click="loadDraft"><i class="ti ti-bolt"></i> AI draft</button>
        <button class="send" :disabled="!reply.trim() || replySending" @click="submitReply">{{ replySending ? "Sending…" : "Send" }}</button>
      </footer>
    </section>
    <section class="read empty muted" v-else>Select a conversation</section>

    <div v-if="mail.paletteOpen" class="overlay" @click.self="mail.paletteOpen = false">
      <div class="palette">
        <input v-model="paletteQuery" placeholder="Type a command…" autofocus />
        <button v-for="a in filteredActions" :key="a.id" class="palrow" @click="runAction(a)">
          <span>{{ a.label }}</span><span class="kbd">{{ a.key }}</span>
        </button>
      </div>
    </div>

    <div v-if="mail.screenerOpen" class="overlay" @click.self="mail.screenerOpen = false">
      <div class="screener">
        <h3>The Screener — {{ mail.screener.length }} first-time senders</h3>
        <p class="muted small">Approve once and they reach your Imbox forever. Deny and you never see them again.</p>
        <div v-for="s in mail.screener" :key="s.id" class="scrow">
          <div><div class="from">{{ s.from }}</div><div class="muted small">{{ s.fromEmail }} — {{ s.subjectPreview }}</div></div>
          <div class="scbtns"><button class="yes" @click="mail.screen(s.id, 'approve')">Yes</button>
            <button class="no" @click="mail.screen(s.id, 'deny')">No</button></div>
        </div>
        <p v-if="!mail.screener.length" class="muted pad">Screener clear.</p>
      </div>
    </div>

    <div v-if="mail.composeOpen" class="overlay" @click.self="mail.composeOpen = false">
      <div class="compose-modal">
        <h3>New message</h3>
        <p v-if="mail.error" class="err">{{ mail.error }}</p>
        <input v-model="composeTo" placeholder="To" autofocus />
        <input v-model="composeSubject" placeholder="Subject" />
        <textarea v-model="composeBody" placeholder="Write something…" rows="8"></textarea>
        <div class="composebtns">
          <button class="cancel" @click="mail.composeOpen = false">Cancel</button>
          <button class="send" :disabled="!composeTo.trim() || !composeSubject.trim() || composeSending" @click="submitCompose">
            {{ composeSending ? "Sending…" : "Send" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mail { display: grid; grid-template-columns: 200px 300px 1fr; height: calc(100vh - 56px); font-size: 14px; }
.rail { border-right: 1px solid #e6e6e6; padding: 12px; display: flex; flex-direction: column; gap: 2px; }
.compose { display: flex; align-items: center; gap: 8px; background: #1a73e8; color: #fff; border: 0; border-radius: 8px; padding: 9px; margin-bottom: 8px; cursor: pointer; }
.navitem { display: flex; align-items: center; gap: 8px; padding: 7px 10px; border: 0; background: none; border-radius: 8px; cursor: pointer; text-align: left; color: #444; }
.navitem.on { background: #e8f0fe; color: #1a73e8; font-weight: 500; }
.navitem .count, .navitem .badge { margin-left: auto; font-size: 12px; }
.navitem .badge { background: #fce8b2; color: #7a5b00; border-radius: 10px; padding: 0 7px; }
.sep { height: 1px; background: #eee; margin: 8px 4px; }
.railhint { font-size: 12px; color: #999; padding: 2px 10px; }
.foot { margin-top: auto; font-size: 12px; color: #888; display: flex; gap: 6px; align-items: center; }
.foot .ti { color: #1e8e3e; }
.list { border-right: 1px solid #e6e6e6; overflow-y: auto; }
.listhead { display: flex; justify-content: space-between; padding: 10px 12px; border-bottom: 1px solid #eee; font-weight: 500; }
.row { padding: 9px 12px; border-bottom: 1px solid #f1f1f1; cursor: pointer; }
.row.on { background: #e8f0fe; border-left: 2px solid #1a73e8; }
.row.unread .from, .row.unread .subj { font-weight: 600; }
.rowtop { display: flex; justify-content: space-between; }
.ts { font-size: 12px; color: #999; }
.snip { color: #777; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.later { color: #b08900; font-size: 13px; }
.read { display: flex; flex-direction: column; overflow: hidden; }
.read.empty { align-items: center; justify-content: center; }
.readhead { display: flex; align-items: center; gap: 10px; padding: 12px 16px; border-bottom: 1px solid #eee; }
.who { flex: 1; }
.subj.big { font-size: 16px; font-weight: 500; }
.act { width: 34px; height: 34px; border: 1px solid #e0e0e0; background: #fff; border-radius: 8px; cursor: pointer; color: #555; }
.act.ok { color: #1e8e3e; }
.ai { margin: 12px 16px; padding: 8px 12px; background: #e8f0fe; color: #1a4fa0; border-radius: 8px; font-size: 13px; display: flex; gap: 8px; }
.body { padding: 4px 16px; line-height: 1.7; overflow-y: auto; flex: 1; }
.replybar { display: flex; gap: 10px; align-items: center; padding: 12px 16px; border-top: 1px solid #eee; }
.replybar input { flex: 1; padding: 9px 12px; border: 1px solid #e0e0e0; border-radius: 8px; }
.replybar button, .composebtns button { padding: 8px 14px; border-radius: 8px; border: 1px solid #e0e0e0; background: #fff; cursor: pointer; }
.replybar button.send, .composebtns button.send { background: #1a73e8; color: #fff; border: 0; }
.replybar button:disabled, .composebtns button:disabled { opacity: 0.5; cursor: default; }
.compose .kbd { margin-left: auto; font-family: monospace; font-size: 11px; opacity: 0.7; }
.compose-modal { background: #fff; width: 520px; border-radius: 12px; box-shadow: 0 12px 40px rgba(0,0,0,0.2); padding: 16px; display: flex; flex-direction: column; gap: 10px; }
.compose-modal input, .compose-modal textarea { width: 100%; padding: 9px 12px; border: 1px solid #e0e0e0; border-radius: 8px; font: inherit; box-sizing: border-box; }
.composebtns { display: flex; justify-content: flex-end; gap: 8px; }
.muted { color: #999; } .small { font-size: 12px; } .pad { padding: 16px; } .err { color: #c5221f; padding: 12px; }
.overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.3); display: flex; align-items: flex-start; justify-content: center; padding-top: 12vh; }
.palette, .screener { background: #fff; width: 520px; border-radius: 12px; box-shadow: 0 12px 40px rgba(0,0,0,0.2); padding: 12px; }
.palette input, .screener input { width: 100%; padding: 11px 14px; border: 1px solid #e0e0e0; border-radius: 8px; font-size: 15px; }
.palrow { display: flex; justify-content: space-between; width: 100%; padding: 9px 12px; border: 0; background: none; cursor: pointer; border-radius: 8px; }
.palrow:hover { background: #f5f5f5; }
.kbd { font-family: monospace; font-size: 12px; color: #999; }
.scrow { display: flex; justify-content: space-between; align-items: center; padding: 10px 6px; border-bottom: 1px solid #f1f1f1; }
.scbtns button { padding: 6px 16px; border-radius: 8px; border: 1px solid #ddd; cursor: pointer; margin-left: 6px; }
.scbtns .yes { background: #e6f4ea; color: #1e8e3e; border-color: #b7e1c2; }
.scbtns .no { background: #fce8e6; color: #c5221f; border-color: #f3c0bc; }
.from { color: #222; }
</style>
