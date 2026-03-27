import { createApp, h } from "vue";
import { darkTheme, NConfigProvider, NMessageProvider } from "naive-ui";
import App from "./App.vue";
import "./styles.css";

const app = createApp({
  render() {
    return h(NConfigProvider, { theme: darkTheme }, {
      default: () =>
        h(NMessageProvider, null, {
          default: () => h(App)
        })
    });
  }
});

app.mount("#app");
