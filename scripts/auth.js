// scripts/auth.js
const SUPABASE_URL = "https://ueetacvhykmsfqtqhywp.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVlZXRhY3ZoeWttc2ZxdHFoeXdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4MTk2NzgsImV4cCI6MjA3NzM5NTY3OH0.7bRp6O0AjNOeTDBLyBRTXXLVXKwhHX7ve4PotqZ1JMQ";
(function initAuth() {
  if (!window.supabase) { console.error("[Auth] supabase-js not loaded"); return; }
  const { createClient } = window.supabase;
  const client = createClient(SUPABASE_URL, SUPABASE_KEY);
  window.supabaseClient = client;
  window.login = async (email, password) => {
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    sessionStorage.setItem("sb_session", JSON.stringify(data.session));
    return data;
  };
  window.signup = async (email, password) => {
    const { data, error } = await client.auth.signUp({ email, password });
    if (error) throw error;
    return data;
  };
  window.logout = async () => { await client.auth.signOut(); sessionStorage.removeItem("sb_session"); };
  window.requireAuth = async () => { const { data } = await client.auth.getUser(); if (!data.user) throw new Error("UNAUTHENTICATED"); };
  window.updateAuthLink = async () => {
    const link = document.getElementById("authLink"); if (!link) return;
    const { data } = await client.auth.getUser();
    if (data.user) { link.textContent="내 계정"; link.href="chart.html"; } else { link.textContent="로그인"; link.href="login.html"; }
  };
})();
