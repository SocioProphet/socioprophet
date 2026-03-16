<template>
  <div class="sp-wrap">
    <div class="sp-frame">
      <!-- Top bar -->
      <header class="sp-top">
        <div class="sp-brand">SocioProphet</div>

        <nav class="sp-topnav" aria-label="Primary">
          <a class="sp-topitem" href="#">News &amp; Events</a>
          <a class="sp-topitem" href="#">Law &amp; Regulation</a>
          <a class="sp-topitem" href="#">People &amp; Society</a>
          <a class="sp-topitem" href="#">Economy &amp; Industry</a>
          <a class="sp-topitem" href="#">Capital &amp; Markets</a>
          <RouterLink to="/uikit">UI Kit</RouterLink>
        </nav>

        <div class="sp-topright">
          <button class="sp-iconbtn" aria-label="Search">
            <span class="sp-icon">○</span>
          </button>
        </div>
      </header>

      <div class="sp-body">
        <!-- Left rail -->
        <aside class="sp-rail" aria-label="Tools">
          <button class="sp-railbtn is-active" title="Menu">≡</button>
          <button class="sp-railbtn" title="Docs">▤</button>
          <button class="sp-railbtn" title="Notes">▦</button>
          <button class="sp-railbtn" title="Graph">⌁</button>
          <button class="sp-railbtn" title="Pie">◔</button>
          <button class="sp-railbtn" title="Trend">↗</button>
          <button class="sp-railbtn" title="Bars">▥</button>
          <button class="sp-railbtn" title="Globe">◑</button>
          <button class="sp-railbtn" title="Settings">⚙</button>
        </aside>

        <!-- Work area -->
        <section class="sp-work">
          <!-- Secondary nav row -->
          <div class="sp-subnav">
            <div class="sp-subtitle">News &amp; Events</div>
            <nav class="sp-subtabs" aria-label="Section tabs">
              <a class="sp-subtab is-active" href="#">Dash</a>
              <a class="sp-subtab" href="#">Builder</a>
              <a class="sp-subtab" href="#">Entities</a>
              <a class="sp-subtab" href="#">Layouts</a>
              <a class="sp-subtab" href="#">Specs</a>
              <a class="sp-subtab" href="#">Terminal</a>
              <a class="sp-subtab" href="#">Settings</a>
              <a class="sp-subtab" href="#">Research</a>
              <a class="sp-subtab" href="#">Reader</a>
              <a class="sp-subtab" href="#">Code</a>
              <a class="sp-subtab" href="#">Stories</a>
              <a class="sp-subtab" href="#">Journal</a>
              <a class="sp-subtab" href="#">Experiments</a>
              <a class="sp-subtab" href="#">Runs</a>
              <a class="sp-subtab" href="#">Policies</a>
            </nav>
          </div>

          <!-- Breadcrumb row -->
          <div class="sp-breadcrumbs" aria-label="Breadcrumbs">
            <span>SocioProphet</span><span class="sp-sep">/</span>
            <span>Dashboard</span><span class="sp-sep">/</span>
          </div>

          <!-- Router content -->
          <main class="sp-canvas">
            <slot />
          </main>

          <!-- Bottom search -->
          <footer class="sp-bottom">
            <div class="sp-search">
              <span class="sp-searchicon">🔍</span>
              <input class="sp-searchinput" placeholder="Search..." />
            </div>
          </footer>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts"></script>
