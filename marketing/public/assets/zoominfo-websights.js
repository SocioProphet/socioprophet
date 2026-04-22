window.ZIProjectKey = "35ad52d0251776107780";
(function () {
  var zi = document.createElement("script");
  zi.type = "text/javascript";
  zi.async = true;
  zi.src = "https://js.zi-scripts.com/zi-tag.js";

  function attach() {
    if (document.body && !document.querySelector('script[src="https://js.zi-scripts.com/zi-tag.js"]')) {
      document.body.appendChild(zi);
    }
  }

  if (document.readyState === "complete") {
    attach();
  } else {
    window.addEventListener("load", attach, { once: true });
  }
})();
