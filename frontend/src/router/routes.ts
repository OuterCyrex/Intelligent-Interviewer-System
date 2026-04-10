import type { RouteRecordRaw } from "vue-router";

export const routes: RouteRecordRaw[] = [
  {
    path: "/",
    redirect: "/home"
  },
  {
    path: "/login",
    name: "login",
    component: () => import("../views/LoginView.vue"),
    meta: {
      public: true
    }
  },
  {
    path: "/home",
    name: "home",
    component: () => import("../views/HomeView.vue"),
    meta: {
      requiresAuth: true
    }
  },
  {
    path: "/dashboard",
    name: "dashboard",
    component: () => import("../views/DashboardView.vue"),
    meta: {
      requiresAuth: true
    }
  },
  {
    path: "/interview",
    redirect: "/dashboard"
  },
  {
    path: "/insights",
    name: "insights",
    component: () => import("../views/InsightsView.vue"),
    meta: {
      requiresAuth: true
    }
  },
  {
    path: "/me",
    name: "me",
    component: () => import("../views/MeView.vue"),
    meta: {
      requiresAuth: true
    }
  }
];
