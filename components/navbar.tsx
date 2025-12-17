"use client";

import { Button } from "@/components/ui/button";
import { thingsboard } from "@/lib/tbClient";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import MainNav from "./main-nav";
import axios from "axios";
import { Baby, MapPin, LogOut, User } from "lucide-react";

const Navbar = () => {
  const router = useRouter();
  const [profileInfo, setProfileInfo] = useState({}) as any;

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/login");
    }
    const getData = async () => {
      await axios
        .post(`/api/auth/user`, { token })
        .then((resp) => {
          setProfileInfo(resp.data);
        })
        .catch((error) => {
          localStorage.removeItem("token");
          router.push("/login");
        });
    };
    getData();
  }, [router]);

  return (
    <div className="border-b bg-gradient-to-r from-blue-50 to-purple-50">
      <div className="flex h-20 items-center px-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-sm">
            <Baby className="h-6 w-6 text-pink-500" />
            <MapPin className="h-6 w-6 text-blue-500" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              IoT Ware House
            </h1>
            <p className="text-xs text-muted-foreground">Giám sát và điều khiển kho lạnh</p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-6">
          <MainNav />
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-sm">
              <User className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">
                {profileInfo?.firstName || "User"}
              </span>
            </div>
            <Link href={"/logout"}>
              <Button variant="destructive" className="rounded-full">
                <LogOut className="h-4 w-4 mr-2" />
                Đăng Xuất
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
