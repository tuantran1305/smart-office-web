import Image from "next/image";
import LoginForm from "./components/login-form";

const LoginPage = () => {
  return (
    <section className="relative w-full min-h-screen overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <Image
          src="/school/background_school.jpg"
          alt="Background"
          fill
          sizes="100vw"
          quality={40}
          priority
          placeholder="blur"
          blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0nMTAwJScgaGVpZ2h0PScxMDAlJyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnPjxyZWN0IHdpZHRoPScxMDAlJyBoZWlnaHQ9JzEwMCUnIGZpbGw9JyNlMmU0ZWYnLz48L3N2Zz4="
          style={{ objectFit: "cover" }}
        />
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Foreground content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
        <div className="flex items-center gap-6 md:gap-10 max-w-5xl">
          <Image
            src="/school/logo_school.jpg"
            alt="Logo School"
            width={108}
            height={108}
            className="rounded-full shadow-md"
            quality={60}
            loading="lazy"
          />

          <div className="text-center text-white">
            <h1 className="text-xl md:text-2xl font-semibold tracking-wide">ĐẠI HỌC ĐÀ NẴNG</h1>
            <h2 className="text-xl md:text-2xl font-semibold tracking-wide">TRƯỜNG ĐẠI HỌC SƯ PHẠM KỸ THUẬT</h2>
            <h3 className="text-lg md:text-xl mt-1">KHOA ĐIỆN – ĐIỆN TỬ</h3>

            <p className="mt-4 md:mt-6 text-base md:text-lg font-medium leading-relaxed">
              NGHIÊN CỨU THIẾT KẾ VÀ CHẾ TẠO HỆ THỐNG QUẢN LÝ VÀ GIÁM SÁT KHO HÀNG
              ỨNG DỤNG CÔNG NGHỆ LORA
            </p>

            <div className="mt-4 md:mt-6 text-sm md:text-base leading-relaxed">
              <p>
                <span className="font-semibold">Sinh viên thực hiện:</span> Đào Minh Nhật<br />
                Nguyễn Đỗ Hoàng Nam
              </p>
              <p className="mt-2">
                <span className="font-semibold">Mã Sinh viên:</span> 21115054120140<br />
                21115054120133
              </p>
            </div>
          </div>

          <Image
            src="/school/logo_class.png"
            alt="Logo Class"
            width={108}
            height={108}
            className="rounded-md shadow-md"
            quality={60}
            loading="lazy"
          />
        </div>

        <div className="mt-8">
          <LoginForm />
        </div>
      </div>
    </section>
  );
};

export default LoginPage;
