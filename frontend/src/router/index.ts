import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "../store/auth";
import { pinia } from "../store";
import { routes } from "./routes";

export const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach((to) => {
  const authStore = useAuthStore(pinia);
  const requiresAuth = Boolean(to.meta.requiresAuth);
  const isPublic = Boolean(to.meta.public);

  if (requiresAuth && !authStore.isLoggedIn) {
    return {
      path: "/login",
      query: {
        redirect: to.fullPath
      }
    };
  }

  if (isPublic && authStore.isLoggedIn && to.path === "/login") {
    const redirect = typeof to.query.redirect === "string" ? to.query.redirect : "/home";
    return redirect;
  }

  return true;
});
