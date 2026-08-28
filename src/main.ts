import { createApp } from "vue";
import App from "./App.vue";
import "./index.css";

import { loadServiceData } from "./lib/service-data";
import { router } from "./router";

function getApplicationRoot(): HTMLElement {
  const root = document.getElementById("root");
  if (!root) {
    throw new Error("Application root element was not found");
  }
  return root;
}

const root = getApplicationRoot();

async function bootstrap() {
  try {
    const serviceData = await loadServiceData();
    createApp(App, { serviceData }).use(router).mount(root);
  } catch (error) {
    console.error("Unable to start Services Map", error);
    root.innerHTML = `
      <main style="min-height:100vh;display:grid;place-items:center;padding:2rem;background:#090b10;color:#f5f7fa;font-family:system-ui,sans-serif">
        <section style="max-width:36rem;text-align:center">
          <h1 style="font-size:1.25rem;margin:0 0 .75rem">Services Map is unavailable</h1>
          <p style="margin:0;color:#9aa4b2">The service data source could not be loaded. Check the data URL and try again.</p>
        </section>
      </main>
    `;
  }
}

void bootstrap();