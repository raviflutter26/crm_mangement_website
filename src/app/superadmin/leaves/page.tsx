"use client";
import LeavePage from "@/components/LeavePage";
export default function SuperAdminLeaves() { 
    return <LeavePage showNotify={(type, msg) => console.log(type, msg)} />; 
}
