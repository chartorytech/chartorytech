// scripts/auth.js
// === Supabase 연결 설정 ===
const SUPABASE_URL = "https://ueetacvhykmsfqtpqhywp.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVlZXRhY3ZoeWttc2ZxdHFoeXdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4MTk2NzgsImV4cCI6MjA3NzM5NTY3OH0.7bRp6O0AjNOeTDBLyBRTXXLVXKwhHX7ve4PotqZ1JMQ";

// === Supabase 초기화 ===
if (!window.supabase) {
  alert("supabase-js 라이브러리가 로드되지 않았습니다.\nlogin.html 하단 스크립트 순서를 확인하세요.");
}

const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);

// === 인증 관련 함수들 ===
async function login(email, password) {
  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) throw error;
  sessionStorage.setItem("sb_session", JSON.stringify(data.session));
  return data;
}

async function signup(email, password) {
  const { data, error } = await supabaseClient.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

async function logout() {
  await supabaseClient.auth.signOut();
  sessionStorage.removeItem("sb_session");
}

async function requireAuth() {
  const { data } = await supabaseClient.auth.getUser();
  if (!data.user) throw new Error("UNAUTHENTICATED");
}

async function updateAuthLink() {
  const link = document.getElementById("authLink");
  if (!link) return;
  const { data } = await supabaseClient.auth.getUser();
  if (data.user) {
    link.textContent = "내 계정";
    link.href = "chart.html";
  } else {
    link.textContent = "로그인";
    link.href = "login.html";
  }
}
