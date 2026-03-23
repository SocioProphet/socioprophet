import DefaultTheme from "vitepress/theme";
import { h, onMounted, onBeforeUnmount } from "vue";
import "./custom.css";

export default {
  ...DefaultTheme,
  Layout() {
    let observer: MutationObserver | null = null;

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
      observer = new MutationObserver(() => patchBrandLinks());
      observer.observe(document.body, { childList: true, subtree: true });
    });

    onBeforeUnmount(() => {
      if (observer) observer.disconnect();
    });

    return h(DefaultTheme.Layout);
  },
};
