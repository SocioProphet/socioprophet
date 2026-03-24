import DefaultTheme from "vitepress/theme";
import { h, onMounted, onBeforeUnmount } from "vue";
import "./custom.css";

export default {
  ...DefaultTheme,
  Layout() {
    let observer: MutationObserver | null = null;


    const patchInternalDocLinks = () => {
      const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href]'));
      for (const link of links) {
        const href = link.getAttribute('href') || '';
        if (!href) continue;

        if (href === '/') {
          link.href = 'https://socioprophet.com/documentation/';
          continue;
        }

        if (href.startsWith('/guide/')) {
          const parts = href.split('#');
          const base = parts[0].replace(/^\/guide\//, '').replace(/\/$/, '');
          const hash = parts[1] ? '#' + parts[1] : '';
          link.href = `https://socioprophet.com/documentation/${base}/${hash}`;
          continue;
        }

        if (href.startsWith('https://socioprophet-web.web.app/guide/')) {
          const parts = href.split('#');
          const base = parts[0].replace('https://socioprophet-web.web.app/guide/', '').replace(/\/$/, '');
          const hash = parts[1] ? '#' + parts[1] : '';
          link.href = `https://socioprophet.com/documentation/${base}/${hash}`;
          continue;
        }
      }
    };

    const patchBrandLinks = () => {
      const links = Array.from(document.querySelectorAll<HTMLAnchorElement>(".VPNavBarTitle a"));
      for (const link of links) {
        link.href = "https://socioprophet.com/";
        link.target = "_self";
        link.removeAttribute("rel");
        link.setAttribute("aria-label", "SocioProphet home");
      }
    };

    onMounted(() => {
      patchBrandLinks();
      patchInternalDocLinks();
      observer = new MutationObserver(() => { patchBrandLinks(); patchInternalDocLinks(); });
      observer.observe(document.body, { childList: true, subtree: true });
    });

    onBeforeUnmount(() => {
      if (observer) observer.disconnect();
    });

    return h(DefaultTheme.Layout);
  },
};
