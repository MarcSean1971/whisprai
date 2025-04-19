
import React, { useState, useEffect } from "react";
import { Header } from "@/components/home/Header";
import { BottomNavigation } from "@/components/home/BottomNavigation";
import { useNavigate } from "react-router-dom";
import { useAdmin } from "@/hooks/use-admin";
import { ContactsList } from "@/components/contacts/ContactsList";

export default function Contacts() {
  const navigate = useNavigate();
  const { isAdmin, loading: isAdminLoading } = useAdmin();

  return (
    <div className="flex flex-col h-screen bg-background">
      <Header />
      
      <div className="flex-1 overflow-y-auto">
        <ContactsList />
      </div>
      
      <BottomNavigation 
        activeTab="contacts"
        isAdmin={isAdmin}
        isLoading={isAdminLoading}
      />
    </div>
  );
}
