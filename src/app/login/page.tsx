"use client";

import LoginPage from "@/components/LoginPage";
import { useRouter } from "next/navigation";

export default function Login() {
  const router = useRouter();

  const handleLogin = (token: string, user: any) => {
    localStorage.setItem("ravi_zoho_token", token);
    localStorage.setItem("ravi_zoho_user", JSON.stringify(user));
    router.push("/dashboard");
  };

  return <LoginPage onLogin={handleLogin} showNotify={() => {}} />;
}
