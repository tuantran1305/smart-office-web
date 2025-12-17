"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { thingsboard } from "@/lib/tbClient";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { Loader } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";

const LoginFormSchema = z.object({
  username: z.string().min(1).email(),
  password: z.string().min(8),
});

type LoginFormValues = z.infer<typeof LoginFormSchema>;

const LoginForm = () => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(LoginFormSchema),
    mode: "onBlur",
    defaultValues: {
      username: "tuan.tran.uht@gmail.com",
      password: "12345678",
    },
  });

  async function onSubmit(data: LoginFormValues) {
    setLoading(true);
    await axios
      .post(`/api/auth/login`, data)
      .then((resp: any) => {
        if (resp?.data.token) {
          if (typeof window !== "undefined") {
            localStorage.setItem("token", resp.data.token);
          }
          toast.success("Đăng Nhập Thành Công");
          router.push("/");
        }
      })
      .catch((error) => {
        console.error(error);
        const msg =
          (error?.response?.data && (error.response.data.message || JSON.stringify(error.response.data))) ||
          error?.message ||
          "Có Lỗi Xảy Ra";
        toast.error(msg);
      })
      .finally(() => {
        setLoading(false);
      });
  }

  return (
    <Card className="w-[24em]">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">Đăng Nhập</CardTitle>
        <CardDescription>Truy Cập Bảng Điều Khiển IoT</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="example@mail.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mật Khẩu</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Nhập mật khẩu"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="w-full bg-gray-900"
              disabled={loading}
            >
              {loading && <Loader className="mr-2 h-4 w-4 animate-spin" />}
              Đăng Nhập
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default LoginForm;
