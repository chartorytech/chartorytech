// scripts/auth.js
const SUPABASE_URL = "https://YOUR_PROJECT.supabase.co";   // ← 본인 프로젝트 URL
const SUPABASE_KEY = "YOUR_ANON_PUBLIC_KEY";               // ← anon public key
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);

async function login(email, password){
  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if(error) throw error;
  sessionStorage.setItem("sb_session", JSON.stringify(data.session));
  return data;
}
async function signup(email, password){
  const { data, error } = await supabaseClient.auth.signUp({ email, password });
  if(error) throw error;
  return data;
}
async function logout(){ await supabaseClient.auth.signOut(); sessionStorage.removeItem("sb_session"); }
async function requireAuth(){ const { data } = await supabaseClient.auth.getUser(); if(!data.user) throw new Error("UNAUTHENTICATED"); }
async function updateAuthLink(){
  const link = document.getElementById("authLink"); if(!link) return;
  const { data } = await supabaseClient.auth.getUser();
  if(data.user){ link.textContent="내 계정"; link.href="chart.html"; } else { link.textContent="로그인"; link.href="login.html"; }
}
